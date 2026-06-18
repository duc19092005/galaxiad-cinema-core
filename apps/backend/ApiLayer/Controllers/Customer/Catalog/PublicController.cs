using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Public.Responses;
using BusinessLayer.Entities.MovieInfos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shared.Interfaces.Persistence;
using Shared.Localization;
using Shared.Utils;

namespace ApiLayer.Controllers.Customer.Catalog;

[ApiController]
[Route("api/v1/[controller]/")]
public class PublicController : ControllerBase
{
    // Đây là Controller Public ai cũng có thể Access được
    private readonly ILogger<PublicController> _logger;
    private readonly IUnitOfWork _unitOfWork;

    public PublicController(ILogger<PublicController> logger, IUnitOfWork unitOfWork)
    {
        this._logger = logger;
        this._unitOfWork = unitOfWork;
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
    public async Task<IActionResult> GetMovies(
        [FromQuery] string? city,
        [FromQuery] string? status,
        [FromQuery] Guid? cinemaId)
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
                // Mặc định: tất cả phim chưa bị xóa và đang hoạt động hoặc sắp chiếu
                query = query.Where(x => x.IsActive || x.IsCommingSoon);
                break;
        }

        // Lọc phim theo thành phố: chỉ lấy phim có liên kết với rạp ở thành phố được chọn
        if (!string.IsNullOrEmpty(city))
        {
            query = query.Where(x => x.MovieCinemaEntities
                .Any(mc => mc.CinemaInfoEntity.CinemaCity.Contains(city)));
        }

        // Lọc phim theo rạp
        if (cinemaId.HasValue)
        {
            query = query.Where(x => x.MovieCinemaEntities
                .Any(mc => mc.CinemaId == cinemaId.Value));
        }

        var getMovies = await query.Select(x => new MovieInfoRes()
        {
            MovieId = x.MovieId,
            MovieName = x.MovieName,
            MovieDuration = x.MovieDuration,
            MoviePosterURL = x.MovieImageUrl,
            MovieBannerURL = x.MovieBannerUrl,
            MovieRequiredAge = x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.TrimEnd().TrimStart(),
            MovieFormatInfos = string.Join(", ", x.MovieFormatMovieInfoEntity.Select(m => m.MovieFormatInfoEntity.MovieFormatName)),
            MovieCategoryInfos = string.Join(", ", x.MovieGenreMovieInfoEntity.Select(m => m.MovieGenreInfoEntity.MovieGenreName)),
            IsCommingSoon = x.IsCommingSoon,
            // DB lưu UTC, convert sang giờ Việt Nam cho FE
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
            MovieBannerURL = x.MovieBannerUrl,
            MovieRequiredAge = x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.TrimEnd().TrimStart(),
            MovieFormatInfos = string.Join(", ", x.MovieFormatMovieInfoEntity.Select(m => m.MovieFormatInfoEntity.MovieFormatName)),
            IsCommingSoon = x.IsCommingSoon,
            MovieCategoryInfos = string.Join(", ", x.MovieGenreMovieInfoEntity.Select(m => m.MovieGenreInfoEntity.MovieGenreName)),
            ReleaseDate = x.ActiveAt,
            Actor = x.Actors,
            Director = x.Director
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
        // DB lưu UTC → so sánh với DateTime.UtcNow
        var nowUtc = DateTime.UtcNow;
        var query = Query<MovieScheduleInfoEntity>()
            .Where(x => !x.IsDeleted && x.MovieId == MovieId && x.StartTime > nowUtc);

        // Lọc lịch chiếu theo thành phố
        if (!string.IsNullOrEmpty(city))
        {
            query = query.Where(x => x.AuditoriumInfoEntities != null
                && x.AuditoriumInfoEntities.CinemaInfoEntity != null
                && x.AuditoriumInfoEntities.CinemaInfoEntity.CinemaCity.Contains(city));
        }

        // Lấy danh sách UTC times từ DB
        var scheduleUtcTimes = await query
            .Select(x => x.StartTime)
            .Distinct()
            .OrderBy(d => d)
            .ToListAsync();

        // Convert UTC → Việt Nam để lấy ngày theo giờ VN
        var findSchedulesDates = scheduleUtcTimes
            .Select(utc => DateTimeHelper.ToVietnamTime(utc).Date)
            .Distinct()
            .OrderBy(d => d)
            .Select(d => d.ToString("yyyy-MM-dd"))
            .ToList();

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
        // ScheduleDate là ngày từ FE theo giờ Việt Nam → convert sang UTC range
        var startOfDayVn = ScheduleDate.Date; // bắt đầu ngày VN
        var startUtc = DateTimeHelper.ToUtc(startOfDayVn); // 00:00 VN → UTC
        var endUtc = startUtc.AddDays(1);
        var nowUtc = DateTime.UtcNow;

        _logger.LogInformation(
            "GetScheduleDetails: MovieId={MovieId}, Date={ScheduleDate}, city={City}, UTC range=[{Start}, {End})",
            MovieId, ScheduleDate, city, startUtc, endUtc);

        // Step 1: Build base query with Include to load navigation properties
        var query = Query<MovieScheduleInfoEntity>()
            .Include(x => x.AuditoriumInfoEntities)
                .ThenInclude(a => a!.CinemaInfoEntity)
            .Include(x => x.MovieFormatInfoEntity)
            .Where(x => !x.IsDeleted
                     && x.MovieId == MovieId
                     && x.StartTime >= startUtc
                     && x.StartTime < endUtc
                     && x.StartTime > nowUtc);

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

        // Step 4: Convert StartTime UTC → giờ Việt Nam trước khi trả về FE
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
                    ShowTime = DateTimeHelper.ToVietnamTime(s.StartTime) // UTC → giờ VN
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

    /// <summary>
    /// Lấy danh sách các ngày có lịch chiếu (không yêu cầu MovieId), dùng cho trang Home/Showtimes
    /// </summary>
    [HttpGet("UpcomingDates")]
    public async Task<IActionResult> GetAllUpcomingDates([FromQuery] string? city, [FromQuery] Guid? cinemaId)
    {
        // DB lưu UTC → so sánh với DateTime.UtcNow
        var nowUtc = DateTime.UtcNow;
        var query = Query<MovieScheduleInfoEntity>()
            .Where(x => !x.IsDeleted && x.StartTime > nowUtc);

        // Lọc theo thành phố
        if (!string.IsNullOrEmpty(city))
        {
            query = query.Where(x => x.AuditoriumInfoEntities != null
                && x.AuditoriumInfoEntities.CinemaInfoEntity != null
                && x.AuditoriumInfoEntities.CinemaInfoEntity.CinemaCity.Contains(city));
        }

        // Lọc theo rạp
        if (cinemaId.HasValue)
        {
            query = query.Where(x => x.AuditoriumInfoEntities!.CinemaId == cinemaId.Value);
        }

        var scheduleUtcTimes = await query
            .Select(x => x.StartTime)
            .Distinct()
            .OrderBy(d => d)
            .ToListAsync();

        // Convert UTC → Việt Nam để lấy ngày theo giờ VN
        var findSchedulesDates = scheduleUtcTimes
            .Select(utc => DateTimeHelper.ToVietnamTime(utc).Date)
            .Distinct()
            .OrderBy(d => d)
            .Select(d => d.ToString("yyyy-MM-dd"))
            .Take(14) // Giới hạn 14 ngày tới
            .ToList();

        return Ok(new BaseResponse<List<string>>()
        {
            Data = findSchedulesDates,
            IsSuccess = true,
            Message = "Thành công"
        });
    }

    private IQueryable<TEntity> Query<TEntity>() where TEntity : class
    {
        return _unitOfWork.Repository<TEntity>().Query();
    }
}
