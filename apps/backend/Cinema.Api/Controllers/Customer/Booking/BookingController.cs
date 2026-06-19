using System.Text.Json;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Booking;
using Cinema.Application.UseCases.Booking;
using Cinema.Application.Infrastructure.Booking;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cinema.Domain.Localization;

namespace Cinema.Api.Controllers.Customer.Booking;

// ==========================================
// BOOKING ENDPOINTS (cần đăng nhập)
// ==========================================

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
    private readonly SseConnectionManager _sseManager;
    private readonly ILogger<BookingController> _logger;
    private readonly IConfiguration _configuration;

    public BookingController(
        CreateBookingUseCase createBookingUseCase,
        GetTicketDataUseCase getTicketDataUseCase,
        ProcessVnPayCallbackUseCase processVnPayCallbackUseCase,
        GetUserAccountInfoUseCase getUserAccountInfoUseCase,
        GetUserBookingHistoryUseCase getUserBookingHistoryUseCase,
        SseConnectionManager sseManager,
        ILogger<BookingController> logger,
        IConfiguration configuration)
    {
        _createBookingUseCase = createBookingUseCase;
        _getTicketDataUseCase = getTicketDataUseCase;
        _processVnPayCallbackUseCase = processVnPayCallbackUseCase;
        _getUserAccountInfoUseCase = getUserAccountInfoUseCase;
        _getUserBookingHistoryUseCase = getUserBookingHistoryUseCase;
        _sseManager = sseManager;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Tạo đơn đặt vé và nhận VNPay URL để thanh toán
    /// </summary>
    [HttpPost("create")]
    public async Task<IActionResult> CreateBooking([FromBody] ReqCreateBookingDto request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var result = await _createBookingUseCase.ExecuteAsync(request, ipAddress);
        return Ok(result);
    }

    /// <summary>
    /// Lấy thông tin vé (JSON) - Không cần đăng nhập, dùng orderId
    /// </summary>
    [HttpGet("ticket/{orderId}")]
    public async Task<IActionResult> GetTicketData(Guid orderId)
    {
        var ticket = await _getTicketDataUseCase.ExecuteAsync(orderId);
        return Ok(new BaseResponse<ResTicketPdfDto>
        {
            IsSuccess = true,
            Data = ticket,
            Message = "Lấy thông tin vé thành công."
        });
    }

    /// <summary>
    /// Tải vé dưới dạng file text - Không cần đăng nhập, dùng orderId
    /// </summary>
    [HttpGet("ticket/{orderId}/download")]
    public async Task<IActionResult> DownloadTicket(Guid orderId)
    {
        var ticket = await _getTicketDataUseCase.ExecuteAsync(orderId);
        var fileBytes = _getTicketDataUseCase.GenerateTicketPdf(ticket);
        return File(fileBytes, "text/plain", $"ticket_{orderId}.txt");
    }

    /// <summary>
    /// VNPay gọi callback sau khi thanh toán xong.
    /// Luôn redirect về FE bất kể kết quả xử lý.
    /// </summary>
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

            var (success, orderId) = await _processVnPayCallbackUseCase.ExecuteAsync(vnpParams);

            // Gửi SSE event cho FE
            var paymentEvent = new PaymentStatusEvent
            {
                OrderId = orderId,
                Status = success ? "success" : "failed",
                Message = success ? Messages.Booking.PaymentSuccess : Messages.Booking.PaymentFailed,
                TransactionId = vnpParams.TryGetValue("vnp_TransactionNo", out var txnNo) ? txnNo : null
            };

            _sseManager.NotifyPaymentResult(orderId, paymentEvent);

            // Redirect user về FE
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

            // Luôn redirect về FE dù có lỗi, không bao giờ để user thấy trang lỗi backend
            var orderId = Request.Query.TryGetValue("vnp_TxnRef", out var txnRef) ? txnRef.ToString() : "";
            var failedUrl = $"{frontendBaseUrl}/booking/failed?orderId={orderId}&error=processing_error";
            return Redirect(failedUrl);
        }
    }

    /// <summary>
    /// SSE endpoint - FE subscribe để nhận kết quả thanh toán realtime
    /// Hỗ trợ cả Web và Mobile (SSE qua HTTP)
    /// </summary>
    [Authorize]
    [HttpGet("payment-status/{orderId}")]
    public async Task PaymentStatusSse(Guid orderId, CancellationToken cancellationToken)
    {
        Response.Headers.Append("Content-Type", "text/event-stream");
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("Connection", "keep-alive");
        Response.Headers.Append("X-Accel-Buffering", "no");

        var tcs = _sseManager.Register(orderId);

        try
        {
            // Gửi heartbeat để giữ connection
            _ = Task.Run(async () =>
            {
                while (!cancellationToken.IsCancellationRequested)
                {
                    try
                    {
                        await Response.WriteAsync($": heartbeat\n\n", cancellationToken);
                        await Response.Body.FlushAsync(cancellationToken);
                        await Task.Delay(15000, cancellationToken);
                    }
                    catch
                    {
                        break;
                    }
                }
            }, cancellationToken);

            // Chờ kết quả thanh toán (timeout 15 phút)
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromMinutes(15));

            var result = await tcs.Task.WaitAsync(cts.Token);

            // Gửi kết quả qua SSE
            var eventData = JsonSerializer.Serialize(result);
            await Response.WriteAsync($"event: payment-result\ndata: {eventData}\n\n", cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("SSE connection cancelled for order {OrderId}", orderId);
        }
        finally
        {
            _sseManager.Unregister(orderId);
        }
    }

    /// <summary>
    /// Lấy thông tin tài khoản người dùng đang đăng nhập
    /// </summary>
    [Authorize]
    [HttpGet("account-info")]
    public async Task<IActionResult> GetAccountInfo()
    {
        var result = await _getUserAccountInfoUseCase.ExecuteAsync();
        return Ok(result);
    }

    /// <summary>
    /// Lấy lịch sử đặt vé của người dùng đang đăng nhập
    /// </summary>
    [Authorize]
    [HttpGet("history")]
    public async Task<IActionResult> GetBookingHistory()
    {
        var result = await _getUserBookingHistoryUseCase.ExecuteAsync();
        return Ok(result);
    }
}
