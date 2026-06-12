using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Public.Responses;
using BusinessLayer.Entities.MovieInfos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shared.Interfaces.Persistence;
using Shared.Localization;

namespace ApiLayer.Controllers.Public;

[ApiController]
[Route("api/v1/[controller]/")]
public class PublicController : ControllerBase
{
    // Đây là Controller Public ai cũng có thể Access được
    // Controller naày làmdđơn giản thoi
    private readonly ILogger<PublicController> _logger;
    private readonly IUnitOfWork _unitOfWork;

    public PublicController(ILogger<PublicController> logger, IUnitOfWork unitOfWork)
    {
        this._logger = logger;
        this._unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Lấy thời gian hiện tại theo múi giờ Việt Nam (UTC+7)
    /// </summary>
    private static DateTime GetVietnamNow()
    {
        TimeZoneInfo vietnamTimeZone;
        try
        {
            vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"); // Windows
        }
        catch (TimeZoneNotFoundException)
        {
            vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh"); // Linux/Mac
        }
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone);
    }

    [HttpGet("MovieFormats")]
    public async Task<IActionResult> GetMovieFormats()
    {
        var getMovieFormats = await Query<MovieFormatInfoEntity>().Select(x => new BaseFormatInfo()
        {
            FormatId = x.MovieFormatId,
            FormatName = x.MovieFormatName
        }).ToListAsync();
        var baseRes = new BaseResponse<List<BaseFormatInfo>>()
        {
            Data = getMovieFormats,
            IsSuccess = true,
            Message = Messages.MovieFormat.GetDataSuccess
        };
        return Ok(baseRes);
    }

    [HttpGet("MovieRequiredAge")]
    public async Task<IActionResult> GetMovieRequiredAge()
    {
        var getMovieRequiredAge = await Query<movieRequiredAgeEntity>().Select(x => new BaseRequiredAge()
        {
            MovieRequiredAgeSymbolId = x.MovieRequiredAgeId,
            MovieRequiredAgeDescription = x.MovieRequiredAgeDescription,
            MovieRequiredAgeSymbol = x.MovieRequiredAgeSymbol.TrimEnd().TrimStart(),
        }).ToListAsync();
        var baseRes = new BaseResponse<List<BaseRequiredAge>>()
        {
            Data = getMovieRequiredAge,
            IsSuccess = true,
            Message = Messages.RequiredAge.GetRequiredAgeCompleted
        };
        return Ok(baseRes);
    }

    // Cái này để truy vấn thông tin những phim sắp chiếu hoặc đang chiếu Public
    // Query param "status":
    //   - "now-showing"  : Phim đang chiếu (IsActive=true, IsCommingSoon=false)
    //   - "coming-soon"  : Phim sắp chiếu  (IsCommingSoon=true, chưa bị xóa)
    //   - không truyền   : Trả tất cả phim chưa bị xóa & (đang chiếu HOẶC sắp chiếu)

    [HttpGet("Movies")]
    public async Task<IActionResult> GetMovies([FromQuery] string? city, [FromQuery] string? status)
    {
        var query = Query<MovieInfoEntity>()
            .Where(x => !x.IsDeleted);

        // Lọc theo trạng thái phim
        switch (status?.ToLower())
        {
            case "now-showing":
                // Phim đang chiếu: IsActive = true VÀ IsCommingSoon = false
                query = query.Where(x => x.IsActive && !x.IsCommingSoon);
                break;
            case "coming-soon":
                // Phim sắp chiếu: IsCommingSoon = true (không cần IsActive vì phim sắp chiếu có thể chưa active)
                query = query.Where(x => x.IsCommingSoon);
                break;
            default:
                // Mặc định: trả tất cả phim đang chiếu hoặc sắp chiếu
                query = query.Where(x => x.IsActive || x.IsCommingSoon);
                break;
        }

        // Lọc phim theo thành phố: chỉ lấy phim có liên kết với rạp ở thành phố được chọn
        if (!string.IsNullOrEmpty(city))
        {
            query = query.Where(x => x.MovieCinemaEntities
                .Any(mc => mc.CinemaInfoEntity.CinemaCity.Contains(city)));
        }

        var getMovies = await query.Select(x => new MovieInfoRes()
        {
            MovieId = x.MovieId,
            MovieName = x.MovieName,
            MovieDuration = x.MovieDuration,
            MoviePosterURL = x.MovieImageUrl,
            MovieRequiredAge = x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.TrimEnd().TrimStart(),
            MovieFormatInfos = string.Join(", ", x.MovieFormatMovieInfoEntity.Select(m => m.MovieFormatInfoEntity.MovieFormatName)),
            IsCommingSoon = x.IsCommingSoon,
            ExpectedReleaseDate = x.ActiveAt
        }).ToListAsync();

        return Ok(new BaseResponse<List<MovieInfoRes>>()
        {
            Data = getMovies,
            IsSuccess = true,
            Message = "Thành công"
        });
    }

    [HttpGet("MovieDetail/{MovieId}")]
    public async Task<IActionResult> GetMovieDetail(Guid MovieId)
    {
        var GetMovieDetail = await Query<MovieInfoEntity>().Where(x => !x.IsDeleted && x.IsActive && x.MovieId == MovieId).Select(x => new MovieDetailInfoRes()
        {
            MovieId = x.MovieId,
            MovieName = x.MovieName,
            MovieDuration = x.MovieDuration,
            MovieDescription = x.MovieDescription,
            MoviePosterURL = x.MovieImageUrl,
            MovieRequiredAge = x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.TrimEnd().TrimStart(),
            MovieFormatInfos = string.Join(", ", x.MovieFormatMovieInfoEntity.Select(m => m.MovieFormatInfoEntity.MovieFormatName)),
            IsCommingSoon = x.IsCommingSoon,
            MovieCategoryInfos = "Tạm thời để null",
            ReleaseDate = x.ActiveAt,
            Actor = "Tạm thời để null",
            Director = "Tạm thời để null"
        }).FirstOrDefaultAsync();
        return Ok(new BaseResponse<MovieDetailInfoRes>()
        {
            Data = GetMovieDetail,
            IsSuccess = true,
            Message = "Response Here"
        });
    }

    [HttpGet("ScheduleDates/{MovieId}")]
    public async Task<IActionResult> GetScheduleDates(Guid MovieId, [FromQuery] string? city)
    {
        var now = GetVietnamNow();
        var query = Query<MovieScheduleInfoEntity>()
            .Where(x => !x.IsDeleted && x.MovieId == MovieId && x.StartTime > now);

        // Lọc lịch chiếu theo thành phố
        if (!string.IsNullOrEmpty(city))
        {
            query = query.Where(x => x.AuditoriumInfoEntities != null
                && x.AuditoriumInfoEntities.CinemaInfoEntity != null
                && x.AuditoriumInfoEntities.CinemaInfoEntity.CinemaCity.Contains(city));
        }

        var schedulesDatesObj = await query
            .Select(x => x.StartTime.Date)
            .Distinct()
            .OrderBy(d => d)
            .ToListAsync();

        var findSchedulesDates = schedulesDatesObj.Select(x => x.ToString("yyyy-MM-dd")).ToList();

        return Ok(new BaseResponse<List<string>>()
        {
            Data = findSchedulesDates,
            IsSuccess = true,
            Message = "Thành công"
        });
    }

    [HttpGet("ScheduleDetails/{MovieId}/{ScheduleDate}")]
    public async Task<IActionResult> GetScheduleDetails(Guid MovieId, DateTime ScheduleDate, [FromQuery] string? city)
    {
        var startDate = ScheduleDate.Date;
        var endDate = startDate.AddDays(1);

        _logger.LogInformation(
            "GetScheduleDetails: MovieId={MovieId}, Date={ScheduleDate}, city={City}, range=[{Start}, {End})",
            MovieId, ScheduleDate, city, startDate, endDate);

        var now = GetVietnamNow();

        // Step 1: Build base query with Include to load navigation properties
        var query = Query<MovieScheduleInfoEntity>()
            .Include(x => x.AuditoriumInfoEntities)
                .ThenInclude(a => a!.CinemaInfoEntity)
            .Include(x => x.MovieFormatInfoEntity)
            .Where(x => !x.IsDeleted
                     && x.MovieId == MovieId
                     && x.StartTime >= startDate
                     && x.StartTime < endDate
                     && x.StartTime > now);

        // Step 2: Filter by city using CinemaCity field (not CinemaLocation)
        if (!string.IsNullOrEmpty(city))
        {
            query = query.Where(x => x.AuditoriumInfoEntities != null
                                  && x.AuditoriumInfoEntities.CinemaInfoEntity != null
                                  && x.AuditoriumInfoEntities.CinemaInfoEntity.CinemaCity.Contains(city));
        }

        // Step 3: Materialize to flat list first (avoid complex GroupBy in SQL)
        var flatSchedules = await query.ToListAsync();

        _logger.LogInformation("GetScheduleDetails: found {Count} raw schedules", flatSchedules.Count);

        // Step 4: Group in memory — EF Core GroupBy with navigation properties is unreliable
        var getScheduleDetails = flatSchedules
            .GroupBy(x => new
            {
                CinemaName = x.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaName ?? "",
                CinemaLocation = x.AuditoriumInfoEntities?.CinemaInfoEntity?.CinemaLocation ?? "",
                MovieFormatName = x.MovieFormatInfoEntity?.MovieFormatName ?? ""
            })
            .Select(g => new GetScheduleDetailsRes()
            {
                CinemaName = g.Key.CinemaName,
                CinemaAddress = g.Key.CinemaLocation,
                MovieFormatName = g.Key.MovieFormatName,
                ScheduleTimesInfos = g.Select(s => new GetScheduleTimeRes()
                {
                    ScheduleId = s.MovieScheduleInfoId,
                    ShowTime = s.StartTime
                })
                .OrderBy(t => t.ShowTime)
                .ToList()
            })
            .ToList();

        return Ok(new BaseResponse<List<GetScheduleDetailsRes>>
        {
            Data = getScheduleDetails,
            IsSuccess = true,
            Message = "Thành công"
        });
    }

    [HttpGet("AuditoriumDetails/{ScheduleId}")]
    public async Task<IActionResult> GetAuditoriumDetails(Guid ScheduleId)
    {
        var getAuditoriumDetails = await Query<MovieScheduleInfoEntity>()
            .Where(x => !x.IsDeleted && x.MovieScheduleInfoId == ScheduleId)
            .Select(x => new GetAuditoriumInfosRes()
            {
                MovieName = x.MovieInfoEntity != null ? x.MovieInfoEntity.MovieName : "",
                MovieVisualFormatName = x.MovieFormatInfoEntity != null ? x.MovieFormatInfoEntity.MovieFormatName : "",
                AuditoriumName = x.AuditoriumInfoEntities != null ? x.AuditoriumInfoEntities.AuditoriumNumber : "",
                AuditoriumId = x.AuditoriumId.ToString(),
                SeatMap = x.AuditoriumInfoEntities != null ? x.AuditoriumInfoEntities.SeatsInfoEntity.Select(s => new GetSeatsRes()
                {
                    SeatId = s.SeatId,
                    SeatName = s.SeatNumber,
                    CoordX = s.CoordX,
                    CoordY = s.CoordY,
                    ColIndex = s.ColIndex,
                    RowIndex = s.RowIndex,
                    IsBooked = s.OrderDetailsInfo.Any(od => od.MovieScheduleId == ScheduleId && od.SeatId == s.SeatId &&
                        (od.OrderInfoEntity.OrderStatus == Shared.Enums.OrderStatusEnum.Booked || od.OrderInfoEntity.OrderStatus == Shared.Enums.OrderStatusEnum.Pending))
                }).ToList() : new List<GetSeatsRes>()
            })
            .FirstOrDefaultAsync();

        if (getAuditoriumDetails == null)
        {
            return Ok(new BaseResponse<GetAuditoriumInfosRes>
            {
                IsSuccess = false,
                Message = "Không tìm thấy thông tin phòng chiếu cho suất chiếu này."
            });
        }

        return Ok(new BaseResponse<GetAuditoriumInfosRes>
        {
            Data = getAuditoriumDetails,
            IsSuccess = true,
            Message = "Thành công"
        });
    }

    private IQueryable<TEntity> Query<TEntity>() where TEntity : class
    {
        return _unitOfWork.Repository<TEntity>().Query();
    }
}
