using System.Text.Json;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Booking;
using BusinessLayer.Services.Booking;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Localization;

namespace ApiLayer.Controllers.Customer.Booking;

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
    /// Lấy danh sách các rạp gần nhất dựa trên vị trí (kinh độ và vĩ độ) của người dùng (tính bằng km)
    /// </summary>
    [HttpGet("nearest-cinemas")]
    public async Task<IActionResult> GetNearestCinemas([FromQuery] double latitude, [FromQuery] double longitude)
    {
        var result = await _bookingService.GetNearestCinemas(latitude, longitude);
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
