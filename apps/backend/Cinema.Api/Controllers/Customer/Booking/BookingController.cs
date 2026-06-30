using System.Text.Json;
using System.Net.WebSockets;
using System.Text;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Infrastructure.Booking;
using Cinema.Application.UseCases.Booking;
using Cinema.Domain.Localization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers.Customer.Booking;

[ApiController]
[Route("api/v1/booking")]
[Tags("Booking - Order & Payment")]
[ApiExplorerSettings(GroupName = "v1-user")]
public class BookingController : ControllerBase
{
    private readonly CreateBookingUseCase _createBookingUseCase;
    private readonly GetTicketDataUseCase _getTicketDataUseCase;
    private readonly ProcessVnPayCallbackUseCase _processVnPayCallbackUseCase;
    private readonly GetUserAccountInfoUseCase _getUserAccountInfoUseCase;
    private readonly GetUserBookingHistoryUseCase _getUserBookingHistoryUseCase;
    private readonly GetBookingCustomerByEmailUseCase _getBookingCustomerByEmailUseCase;
    private readonly PaymentWsManager _paymentWsManager;
    private readonly SeatLockManager _seatLockManager;
    private readonly SeatWsManager _seatWsManager;
    private readonly ILogger<BookingController> _logger;
    private readonly IConfiguration _configuration;

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    public BookingController(
        CreateBookingUseCase createBookingUseCase,
        GetTicketDataUseCase getTicketDataUseCase,
        ProcessVnPayCallbackUseCase processVnPayCallbackUseCase,
        GetUserAccountInfoUseCase getUserAccountInfoUseCase,
        GetUserBookingHistoryUseCase getUserBookingHistoryUseCase,
        GetBookingCustomerByEmailUseCase getBookingCustomerByEmailUseCase,
        PaymentWsManager paymentWsManager,
        SeatLockManager seatLockManager,
        SeatWsManager seatWsManager,
        ILogger<BookingController> logger,
        IConfiguration configuration)
    {
        _createBookingUseCase = createBookingUseCase;
        _getTicketDataUseCase = getTicketDataUseCase;
        _processVnPayCallbackUseCase = processVnPayCallbackUseCase;
        _getUserAccountInfoUseCase = getUserAccountInfoUseCase;
        _getUserBookingHistoryUseCase = getUserBookingHistoryUseCase;
        _getBookingCustomerByEmailUseCase = getBookingCustomerByEmailUseCase;
        _paymentWsManager = paymentWsManager;
        _seatLockManager = seatLockManager;
        _seatWsManager = seatWsManager;
        _logger = logger;
        _configuration = configuration;
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateBooking([FromBody] ReqCreateBookingDto request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var result = await _createBookingUseCase.ExecuteAsync(request, ipAddress);
        return Ok(result);
    }

    [HttpGet("ticket/{orderId}")]
    public async Task<IActionResult> GetTicketData(Guid orderId)
    {
        var ticket = await _getTicketDataUseCase.ExecuteAsync(orderId);
        return Ok(new BaseResponse<ResTicketPdfDto>
        {
            IsSuccess = true,
            Data = ticket,
            Message = Messages.Booking.GetTicketSuccess
        });
    }

    [HttpGet("ticket/{orderId}/download")]
    public async Task<IActionResult> DownloadTicket(Guid orderId)
    {
        var ticket = await _getTicketDataUseCase.ExecuteAsync(orderId);
        var fileBytes = _getTicketDataUseCase.GenerateTicketPdf(ticket);
        return File(fileBytes, "text/plain", $"ticket_{orderId}.txt");
    }

    [HttpGet("vnpay-callback")]
    public async Task<IActionResult> VnPayCallback()
    {
        var frontendBaseUrl = _configuration["FrontendBaseUrl"] ?? "https://renewcinemaprojectfrontend.vercel.app";

        try
        {
            var vnpParams = new Dictionary<string, string>();
            foreach (var (key, value) in Request.Query)
            {
                if (!string.IsNullOrEmpty(key) && key.StartsWith("vnp_"))
                {
                    vnpParams[key] = value.ToString();
                }
            }

            _logger.LogInformation("VNPay callback received with {ParamCount} params: {Params}",
                vnpParams.Count, string.Join(", ", vnpParams.Select(p => $"{p.Key}={p.Value}")));

            var (success, orderId, groupCode) = await _processVnPayCallbackUseCase.ExecuteAsync(vnpParams);

            if (!string.IsNullOrEmpty(groupCode))
            {
                var groupFrontendUrl = success
                    ? $"{frontendBaseUrl}/group-booking/{groupCode}"
                    : $"{frontendBaseUrl}/group-booking/{groupCode}";

                _logger.LogInformation("Group VNPay callback processed. Success={Success}, GroupCode={GroupCode}. Redirecting to {Url}",
                    success, groupCode, groupFrontendUrl);

                return Redirect(groupFrontendUrl);
            }

            var paymentEvent = new PaymentStatusEvent
            {
                OrderId = orderId,
                Status = success ? "success" : "failed",
                Message = success ? Messages.Booking.PaymentSuccess : Messages.Booking.PaymentFailed,
                TransactionId = vnpParams.TryGetValue("vnp_TransactionNo", out var txnNo) ? txnNo : null
            };

            _paymentWsManager.NotifyPaymentResult(orderId, paymentEvent);

            var frontendUrl = success
                ? $"{frontendBaseUrl}/booking/success?orderId={orderId}"
                : $"{frontendBaseUrl}/booking/failed?orderId={orderId}";

            _logger.LogInformation("VNPay callback processed. Success={Success}, OrderId={OrderId}. Redirecting to {Url}",
                success, orderId, frontendUrl);

            return Redirect(frontendUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing VNPay callback. Redirecting to FE failed page.");

            var orderId = Request.Query.TryGetValue("vnp_TxnRef", out var txnRef) ? txnRef.ToString() : "";
            var failedUrl = $"{frontendBaseUrl}/booking/failed?orderId={orderId}&error=processing_error";
            return Redirect(failedUrl);
        }
    }

    [Authorize]
    [HttpGet("payment/ws/{orderId}")]
    public async Task PaymentStatusWs(Guid orderId)
    {
        if (!HttpContext.WebSockets.IsWebSocketRequest)
        {
            HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            return;
        }

        using var webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
        var connectionId = Guid.NewGuid().ToString();
        _paymentWsManager.AddConnection(orderId, connectionId, webSocket);

        try
        {
            var buffer = new byte[1024 * 4];
            while (webSocket.State == WebSocketState.Open)
            {
                var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                if (result.MessageType == WebSocketMessageType.Close)
                    break;
            }
        }
        catch { }
        finally
        {
            _paymentWsManager.RemoveConnection(orderId, connectionId);
            if (webSocket.State != WebSocketState.Closed && webSocket.State != WebSocketState.Aborted)
            {
                try { await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closed by server", CancellationToken.None); }
                catch { }
            }
        }
    }

    [HttpPost("seats/lock")]
    public IActionResult LockSeat([FromBody] ReqLockSeatDto request)
    {
        var clientId = string.IsNullOrWhiteSpace(request.ClientId)
            ? HttpContext.Connection.Id
            : request.ClientId;
        var (success, message, lockedSeats) = _seatLockManager.LockSeat(
            request.ScheduleId, request.SeatId, request.UserName, clientId);

        if (!success)
            return Conflict(new ResSeatLockDto { Success = false, Message = message, LockedSeats = lockedSeats });

        return Ok(new ResSeatLockDto { Success = true, Message = message, LockedSeats = lockedSeats });
    }

    [HttpPost("seats/unlock")]
    public IActionResult UnlockSeat([FromBody] ReqUnlockSeatDto request)
    {
        var clientId = string.IsNullOrWhiteSpace(request.ClientId)
            ? HttpContext.Connection.Id
            : request.ClientId;
        var (success, message, lockedSeats) = _seatLockManager.UnlockSeat(
            request.ScheduleId, request.SeatId, clientId);

        return Ok(new ResSeatLockDto { Success = success, Message = message, LockedSeats = lockedSeats });
    }

    [AllowAnonymous]
    [HttpGet("seats/ws/{scheduleId}")]
    public async Task GetSeatWebSocket(string scheduleId)
    {
        if (!HttpContext.WebSockets.IsWebSocketRequest)
        {
            HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            return;
        }

        using var webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
        var connectionId = Guid.NewGuid().ToString();
        var clientId = Request.Query.TryGetValue("clientId", out var queryClientId) && !string.IsNullOrWhiteSpace(queryClientId)
            ? queryClientId.ToString()
            : HttpContext.Connection.Id;
        _seatWsManager.AddConnection(scheduleId, connectionId, webSocket);

        var initialLockedSeats = _seatLockManager.GetCurrentLockedSeats(scheduleId);
        var initData = JsonSerializer.Serialize(new { type = "initial-state", lockedSeats = initialLockedSeats }, _jsonOptions);
        var bytes = Encoding.UTF8.GetBytes(initData);
        await webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);

        var buffer = new byte[1024 * 4];
        try
        {
            while (webSocket.State == WebSocketState.Open)
            {
                var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                if (result.MessageType == WebSocketMessageType.Close) break;
            }
        }
        catch { }
        finally
        {
            _seatWsManager.RemoveConnection(scheduleId, connectionId);
            _seatLockManager.ReleaseSeatsByClient(clientId);
            if (webSocket.State != WebSocketState.Closed && webSocket.State != WebSocketState.Aborted)
            {
                try { await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closed by server", CancellationToken.None); }
                catch { }
            }
        }
    }

    [Authorize]
    [HttpGet("customer-lookup")]
    public async Task<IActionResult> LookupCustomer([FromQuery] string email)
    {
        var result = await _getBookingCustomerByEmailUseCase.ExecuteAsync(email);
        return Ok(result);
    }

    [Authorize]
    [HttpGet("account-info")]
    public async Task<IActionResult> GetAccountInfo()
    {
        var result = await _getUserAccountInfoUseCase.ExecuteAsync();
        return Ok(result);
    }

    [Authorize]
    [HttpGet("history")]
    public async Task<IActionResult> GetBookingHistory()
    {
        var result = await _getUserBookingHistoryUseCase.ExecuteAsync();
        return Ok(result);
    }
}
