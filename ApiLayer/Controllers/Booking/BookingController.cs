using System.Text.Json;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Booking;
using BusinessLayer.Services.Booking;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Localization;

namespace ApiLayer.Controllers.Booking;

// ==========================================
// PUBLIC ENDPOINTS (không cần đăng nhập)
// ==========================================

[ApiController]
[Route("api/v1/public/movies")]
[Tags("Public - Movies & Booking")]
[ApiExplorerSettings(GroupName = "v1-user")]
public class PublicMovieController : ControllerBase
{
    private readonly BookingService _bookingService;

    public PublicMovieController(BookingService bookingService)
    {
        _bookingService = bookingService;
    }

    /// <summary>
    /// Lấy danh sách phim đang chiếu (hỗ trợ search theo tên phim hoặc tên rạp)
    /// </summary>
    [HttpGet("now-showing")]
    public async Task<IActionResult> GetNowShowing([FromQuery] string? keyword, [FromQuery] Guid? cinemaId, [FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 5)
    {
        var searchParam = keyword ?? cinemaId?.ToString();
        var result = await _bookingService.GetNowShowingMovies(searchParam, pageIndex, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách phim sắp chiếu (hỗ trợ search theo tên phim hoặc tên rạp)
    /// </summary>
    [HttpGet("coming-soon")]
    public async Task<IActionResult> GetComingSoon([FromQuery] string? keyword, [FromQuery] Guid? cinemaId, [FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 5)
    {
        var searchParam = keyword ?? cinemaId?.ToString();
        var result = await _bookingService.GetComingSoonMovies(searchParam, pageIndex, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách thành phố có rạp
    /// </summary>
    [HttpGet("cities")]
    public async Task<IActionResult> GetCities()
    {
        var result = await _bookingService.GetCities();
        return Ok(result);
    }

    /// <summary>
    /// Lấy toàn bộ danh sách thể loại phim
    /// </summary>
    [HttpGet("genres")]
    public async Task<IActionResult> GetGenres()
    {
        var result = await _bookingService.GetGenres();
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách các rạp đang hoạt động (dành cho Combobox tìm kiếm)
    /// </summary>
    [HttpGet("active-cinemas")]
    public async Task<IActionResult> GetActiveCinemas()
    {
        var result = await _bookingService.GetActiveCinemas();
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách các phim đang hoạt động (dành cho Combobox tìm kiếm)
    /// </summary>
    [HttpGet("active-movies")]
    public async Task<IActionResult> GetActiveMovies()
    {
        var result = await _bookingService.GetActiveMovies();
        return Ok(result);
    }

    /// <summary>
    /// Tìm kiếm nâng cao hiển thị cả phim, rạp và giờ chiếu
    /// Dành cho module (Ngày - Phim - Rạp) ở trang chủ
    /// </summary>
    [HttpGet("search-schedules")]
    public async Task<IActionResult> GetAdvancedSearchSchedules(
        [FromQuery] DateTime? date,
        [FromQuery] Guid? movieId,
        [FromQuery] Guid? cinemaId)
    {
        var result = await _bookingService.GetAdvancedSearchSchedules(date, movieId, cinemaId);
        return Ok(result);
    }

    /// <summary>
    /// Lấy chi tiết phim (bao gồm trailer, đạo diễn, diễn viên, ...)
    /// </summary>
    [HttpGet("{movieId}")]
    public async Task<IActionResult> GetMovieDetail(Guid movieId)
    {
        var result = await _bookingService.GetMovieDetail(movieId);
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách rạp + lịch chiếu theo phim và thành phố
    /// </summary>
    [HttpGet("{movieId}/showtimes")]
    public async Task<IActionResult> GetCinemaShowtimes(
        Guid movieId,
        [FromQuery] string city,
        [FromQuery] DateTime? date)
    {
        var result = await _bookingService.GetCinemaShowtimes(movieId, city, date);
        return Ok(result);
    }

    /// <summary>
    /// Lấy sơ đồ ghế cho một lịch chiếu
    /// </summary>
    [HttpGet("schedules/{scheduleId}/seats")]
    public async Task<IActionResult> GetSeatMap(Guid scheduleId)
    {
        var result = await _bookingService.GetSeatMap(scheduleId);
        return Ok(result);
    }

    /// <summary>
    /// Lấy thông tin giá (theo đối tượng: Người lớn, Học sinh, ...) cho một lịch chiếu
    /// </summary>
    [HttpGet("schedules/{scheduleId}/prices")]
    public async Task<IActionResult> GetPricing(Guid scheduleId)
    {
        var result = await _bookingService.GetPricing(scheduleId);
        return Ok(result);
    }
}

// ==========================================
// BOOKING ENDPOINTS (cần đăng nhập)
// ==========================================

[ApiController]
[Route("api/v1/booking")]
[Tags("Booking - Order & Payment")]
[ApiExplorerSettings(GroupName = "v1-user")]
public class BookingController : ControllerBase
{
    private readonly BookingService _bookingService;
    private readonly SseConnectionManager _sseManager;
    private readonly ILogger<BookingController> _logger;

    public BookingController(
        BookingService bookingService,
        SseConnectionManager sseManager,
        ILogger<BookingController> logger)
    {
        _bookingService = bookingService;
        _sseManager = sseManager;
        _logger = logger;
    }

    /// <summary>
    /// Tạo đơn đặt vé và nhận VNPay URL để thanh toán
    /// </summary>
    [HttpPost("create")]
    public async Task<IActionResult> CreateBooking([FromBody] ReqCreateBookingDto request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var result = await _bookingService.CreateBooking(request, ipAddress);
        return Ok(result);
    }

    /// <summary>
    /// Lấy thông tin vé (JSON) - Không cần đăng nhập, dùng orderId
    /// </summary>
    [HttpGet("ticket/{orderId}")]
    public async Task<IActionResult> GetTicketData(Guid orderId)
    {
        var ticket = await _bookingService.GetTicketData(orderId);
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
        var ticket = await _bookingService.GetTicketData(orderId);
        var fileBytes = _bookingService.GenerateTicketPdf(ticket);
        return File(fileBytes, "text/plain", $"ticket_{orderId}.txt");
    }

    /// <summary>
    /// VNPay gọi callback sau khi thanh toán xong
    /// </summary>
    [HttpGet("vnpay-callback")]
    public async Task<IActionResult> VnPayCallback()
    {
        var vnpParams = new Dictionary<string, string>();
        foreach (var (key, value) in Request.Query)
        {
            if (!string.IsNullOrEmpty(key) && key.StartsWith("vnp_"))
            {
                vnpParams[key] = value.ToString();
            }
        }

        var (success, orderId) = await _bookingService.ProcessVnPayCallback(vnpParams);

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
            ? $"https://renewcinemaprojectfrontend.vercel.app/booking/success?orderId={orderId}"
            : $"https://renewcinemaprojectfrontend.vercel.app/booking/failed?orderId={orderId}";

        return Redirect(frontendUrl);
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
        var result = await _bookingService.GetUserAccountInfo();
        return Ok(result);
    }

    /// <summary>
    /// Lấy lịch sử đặt vé của người dùng đang đăng nhập
    /// </summary>
    [Authorize]
    [HttpGet("history")]
    public async Task<IActionResult> GetBookingHistory()
    {
        var result = await _bookingService.GetUserBookingHistory();
        return Ok(result);
    }
}
