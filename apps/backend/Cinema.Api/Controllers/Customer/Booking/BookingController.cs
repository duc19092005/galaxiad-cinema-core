using System.Text.Json;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.Infrastructure.Booking;
using Cinema.Application.UseCases.Booking;
using Cinema.Domain.Localization;
using Cinema.Api.Hubs;

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
    private readonly SeatLockManager _seatLockManager;
    private readonly IHubContext<CinemaHub> _hubContext;
    private readonly ILogger<BookingController> _logger;
    private readonly IConfiguration _configuration;

    public BookingController(
        CreateBookingUseCase createBookingUseCase,
        GetTicketDataUseCase getTicketDataUseCase,
        ProcessVnPayCallbackUseCase processVnPayCallbackUseCase,
        GetUserAccountInfoUseCase getUserAccountInfoUseCase,
        GetUserBookingHistoryUseCase getUserBookingHistoryUseCase,
        GetBookingCustomerByEmailUseCase getBookingCustomerByEmailUseCase,
        SeatLockManager seatLockManager,
        IHubContext<CinemaHub> hubContext,
        ILogger<BookingController> logger,
        IConfiguration configuration)
    {
        _createBookingUseCase = createBookingUseCase;
        _getTicketDataUseCase = getTicketDataUseCase;
        _processVnPayCallbackUseCase = processVnPayCallbackUseCase;
        _getUserAccountInfoUseCase = getUserAccountInfoUseCase;
        _getUserBookingHistoryUseCase = getUserBookingHistoryUseCase;
        _getBookingCustomerByEmailUseCase = getBookingCustomerByEmailUseCase;
        _seatLockManager = seatLockManager;
        _hubContext = hubContext;
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

            var paymentEvent = new
            {
                OrderId = orderId,
                Status = success ? "success" : "failed",
                Message = success ? Messages.Booking.PaymentSuccess : Messages.Booking.PaymentFailed,
                TransactionId = vnpParams.TryGetValue("vnp_TransactionNo", out var txnNo) ? txnNo : null
            };

            // Send payment result via SignalR
            await _hubContext.Clients.Group($"payment-{orderId}").SendAsync("payment-result", paymentEvent);

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
