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
    /// Đã cập nhật: Chỉ lấy phim đã được ủy quyền chiếu tại Rạp này.
    /// </summary>
    [HttpGet("movies-with-formats")]
    public async Task<IActionResult> GetMoviesWithFormats([FromQuery] Guid cinemaId)
    {
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        // 1. Kiểm tra xem TheaterManager có quyền quản lý rạp này không
        var isManagerOfCinema = await _dbContext.CinemaInfoEntity
            .AnyAsync(c => c.CinemaId == cinemaId && (c.TheaterManagerId == userId || c.FacilitiesManagerId == userId));

        if (!isAdmin && !isManagerOfCinema)
        {
            return BadRequest(new BaseResponse<object>
            {
                IsSuccess = false,
                Message = "Bạn không có quyền quản lý rạp này."
            });
        }

        // 2. Lấy danh sách phim đã được ủy quyền cho rạp này
        var authorizedMovieIds = await _dbContext.MovieCinemaEntities
            .Where(mc => mc.CinemaId == cinemaId)
            .Select(mc => mc.MovieId)
            .ToListAsync();

        // 3. Truy vấn các định dạng của các phim đó
        var movies = await _dbContext.MovieFormatMovieInfoEntity
            .Include(mf => mf.MovieInfoEntity)
            .Include(mf => mf.MovieFormatInfoEntity)
            .Where(mf => authorizedMovieIds.Contains(mf.MovieId) &&
                         !mf.MovieInfoEntity.IsDeleted &&
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
    public async Task<IActionResult> GetMyAuditoriums([FromQuery] Guid? cinemaId)
    {
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var query = _dbContext.CinemaInfoEntity.AsNoTracking().AsQueryable();
        
        if (!isAdmin)
        {
            query = query.Where(c => c.TheaterManagerId == userId);
        }
        
        if (cinemaId.HasValue)
        {
            query = query.Where(c => c.CinemaId == cinemaId.Value);
        }

        var cinema = await query.FirstOrDefaultAsync();

        if (cinema == null)
        {
            return BadRequest(new BaseResponse<object>
            {
                IsSuccess = false,
                Message = cinemaId.HasValue ? "Rạp phim theo Id không tìm thấy hoặc bạn không có quyền quản lý." : "Tài khoản của bạn chưa được chỉ định quản lý Rạp phim nào."
            });
        }

        var auditoriums = await _dbContext.AuditoriumInfoEntities
            .AsNoTracking()
            .Where(a => a.CinemaId == cinema.CinemaId && a.IsActive && !a.IsDeleted)
            .Select(a => new
            {
                a.AuditoriumId,
                a.AuditoriumNumber,
                TotalSeats = a.SeatsInfoEntity.Count,
                Formats = a.AuditoriumFormatInfosList.Select(af => new
                {
                    FormatId = af.FormatId,
                    FormatName = af.MovieFormatInfoEntity.MovieFormatName
                }).ToList()
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
