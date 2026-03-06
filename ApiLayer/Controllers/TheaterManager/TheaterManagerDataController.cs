using BusinessLayer.Dtos;
using DataAccess;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApiLayer.Controllers.TheaterManager;

public class TheaterManagerMovieOptionDto
{
    public Guid MovieId { get; set; }
    public string MovieName { get; set; } = string.Empty;
    public Guid FormatId { get; set; }
    public string FormatName { get; set; } = string.Empty;
}

[ApiController]
[Authorize(Policy = "TheaterManager")]
[Route("api/TheaterManager/Data")]
[Tags("Theater Manager - Data Selection")]
[ApiExplorerSettings(GroupName = "v1-theater-manager")]
public class TheaterManagerDataController : ControllerBase
{
    private readonly CinemaDbContext _dbContext;
    private readonly BusinessLayer.Services.IdentityAccess.IUserContextService _userContextService;

    public TheaterManagerDataController(CinemaDbContext dbContext, BusinessLayer.Services.IdentityAccess.IUserContextService userContextService)
    {
        _dbContext = dbContext;
        _userContextService = userContextService;
    }

    /// <summary>
    /// Lấy danh sách Phim kèm theo định dạng (Dành cho chức năng Add/Edit lịch chiếu để chọn Option)
    /// </summary>
    [HttpGet("movies-with-formats")]
    public async Task<IActionResult> GetMoviesWithFormats()
    {
        var movies = await _dbContext.MovieFormatMovieInfoEntity
            .Include(mf => mf.MovieInfoEntity)
            .Include(mf => mf.MovieFormatInfoEntity)
            .Where(mf => mf.MovieInfoEntity.IsActive && !mf.MovieInfoEntity.IsDeleted &&
                         mf.MovieFormatInfoEntity.IsActive && !mf.MovieFormatInfoEntity.IsDeleted)
            .Select(mf => new TheaterManagerMovieOptionDto
            {
                MovieId = mf.MovieId,
                MovieName = mf.MovieInfoEntity.MovieName,
                FormatId = mf.FormatId,
                FormatName = mf.MovieFormatInfoEntity.MovieFormatName
            })
            .ToListAsync();

        return Ok(new BaseResponse<List<TheaterManagerMovieOptionDto>>
        {
            IsSuccess = true,
            Data = movies,
            Message = "Lấy dữ liệu chọn phim thành công"
        });
    }

    /// <summary>
    /// Lấy danh sách các phòng chiếu mà Rạp của TheaterManager hiện tại đang chứa
    /// </summary>
    [HttpGet("my-auditoriums")]
    public async Task<IActionResult> GetMyAuditoriums()
    {
        var userId = _userContextService.GetUserId();

        var cinema = await _dbContext.CinemaInfoEntity
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.ManagerId == userId);

        if (cinema == null)
        {
            return BadRequest(new BaseResponse<object>
            {
                IsSuccess = false,
                Message = "Tài khoản của bạn chưa được chỉ định quản lý Rạp phim nào."
            });
        }

        var auditoriums = await _dbContext.AuditoriumInfoEntities
            .AsNoTracking()
            .Where(a => a.CinemaId == cinema.CinemaId && a.IsActive && !a.IsDeleted)
            .Select(a => new
            {
                a.AuditoriumId,
                a.AuditoriumNumber,
                TotalSeats = a.SeatsInfoEntity.Count
            })
            .ToListAsync();

        return Ok(new BaseResponse<object>
        {
            IsSuccess = true,
            Data = new
            {
                CinemaName = cinema.CinemaName,
                Auditoriums = auditoriums
            },
            Message = "Lấy dữ liệu phòng chiếu thành công."
        });
    }
}
