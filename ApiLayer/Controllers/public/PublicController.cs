using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Public.Responses;
using DataAccess;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shared.Localization;

namespace ApiLayer.Controllers.Public;

[ApiController]
[Route("api/[controller]")]
public class PublicController : ControllerBase
{
    // Đây là Controller Public ai cũng có thể Access được
    // Controller naày làmdđơn giản thoi
    private readonly ILogger<PublicController> _logger;
    private readonly CinemaDbContext _cinemaDbContext;

    public PublicController(ILogger<PublicController> logger, CinemaDbContext cinemaDbContext)
    {
        this._logger = logger;
        this._cinemaDbContext = cinemaDbContext;
    }

    [HttpGet("/MovieFormats")]
    public async Task<IActionResult> GetMovieFormats()
    {
        var getMovieFormats = await _cinemaDbContext.MovieFormatInfoEntity.Select(x => new BaseFormatInfo()
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

    [HttpGet("/MovieRequiredAge")]
    public async Task<IActionResult> GetMovieRequiredAge()
    {
        var getMovieRequiredAge = await _cinemaDbContext.MovieRequiredAgeEntity.Select(x => new BaseRequiredAge()
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

    [HttpGet("/Movies")]
    public async Task<IActionResult> GetMovies()
    {
        // MovieInfoRes

        var getMovies = await _cinemaDbContext.MovieInfoEntity.Where(x => !x.IsDeleted && x.IsActive).Select(x => new MovieInfoRes()
        {
            MovieId = x.MovieId,
            MovieName = x.MovieName,
            MovieDuration = x.MovieDuration,
            MoviePosterURL = x.MovieImageUrl,
            MovieRequiredAge = x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.TrimEnd().TrimStart(),
            MovieFormatInfos = string.Join(", ", x.MovieFormatMovieInfoEntity.Select(m => m.MovieFormatInfoEntity.MovieFormatName)),
            IsCommingSoon = x.IsCommingSoon
        }).ToListAsync();

        return Ok(new BaseResponse<List<MovieInfoRes>>()
        {
            Data = getMovies,
            IsSuccess = true,
            Message = "Response Here"
        });
    }

    [HttpGet("/MovieDetail/{MovieId}")]
    public async Task<IActionResult> GetMovieDetail(Guid MovieId)
    {
        var GetMovieDetail = await _cinemaDbContext.MovieInfoEntity.Where(x => !x.IsDeleted && x.IsActive && x.MovieId == MovieId).Select(x => new MovieDetailInfoRes()
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

    [HttpGet("/ScheduleDates/{MovieId}")]
    public async Task<IActionResult> GetScheduleDates(Guid MovieId)
    {
        // Find 
        var findSchedulesDates = await _cinemaDbContext.MovieScheduleInfoEntity.Where(x => !x.IsDeleted && x.IsActive && x.MovieId == MovieId)
        .Select(x => x.ActiveAt.ToString("dd/MM")).Distinct().ToListAsync();
        return Ok(new BaseResponse<List<string>>()
        {
            Data = findSchedulesDates,
            IsSuccess = true,
            Message = "Response Here"
        });
    }

    [HttpGet("/ScheduleDetails/{MovieId}/{ScheduleDate}")]
    public async Task<IActionResult> GetScheduleDetails(Guid MovieId, DateTime ScheduleDate)
    {
        var startDate = ScheduleDate.Date;
        var endDate = startDate.AddDays(1);

        var getScheduleDetails = await _cinemaDbContext.MovieScheduleInfoEntity
            .Where(x => !x.IsDeleted
                     && x.IsActive
                     && x.MovieId == MovieId
                     && x.ActiveAt >= startDate
                     && x.ActiveAt < endDate)
            .GroupBy(x => new
            {
                CinemaName = x.AuditoriumInfoEntities != null ? x.AuditoriumInfoEntities.CinemaInfoEntity != null ? x.AuditoriumInfoEntities.CinemaInfoEntity.CinemaName : "" : "",
                CinemaLocation = x.AuditoriumInfoEntities != null ? x.AuditoriumInfoEntities.CinemaInfoEntity != null ? x.AuditoriumInfoEntities.CinemaInfoEntity.CinemaLocation : "" : "",
                MovieFormatName = x.MovieFormatInfoEntity != null ? x.MovieFormatInfoEntity.MovieFormatName : ""
            })
            .Select(g => new GetScheduleDetailsRes()
            {
                CinemaName = g.Key.CinemaName,
                CinemaAddress = g.Key.CinemaLocation,
                MovieFormatName = g.Key.MovieFormatName,
                ScheduleTimesInfos = g.Select(s => new GetScheduleTimeRes()
                {
                    ScheduleId = s.MovieScheduleInfoId,
                    ShowTime = s.ActiveAt 
                })
                .OrderBy(t => t.ShowTime)
                .ToList()
            })
            .ToListAsync();

        return Ok(new BaseResponse<List<GetScheduleDetailsRes>>
        {
            Data = getScheduleDetails,
            IsSuccess = true,
            Message = "Response Here"
        });
    }

    [HttpGet("/AuditoriumDetails/{ScheduleId}")]
    public async Task<IActionResult> GetAuditoriumDetails(Guid ScheduleId)
    {
        var getAuditoriumDetails = await _cinemaDbContext.MovieScheduleInfoEntity
            .Where(x => !x.IsDeleted && x.IsActive && x.MovieScheduleInfoId == ScheduleId)
            .Select(x => new GetAuditoriumInfosRes()
            {
                AuditoriumName = x.AuditoriumInfoEntities.AuditoriumNumber,
                AuditoriumId = x.AuditoriumId.ToString(),
                SeatsInfos = x.AuditoriumInfoEntities.SeatsInfoEntity.Select(s => new GetSeatsRes()
                {
                    SeatId = s.SeatId,
                    SeatName = s.SeatNumber,
                    CoordX = s.CoordX,
                    CoordY = s.CoordY,
                    ColIndex = s.ColIndex,
                    RowIndex = s.RowIndex,
                    IsBooked = s.OrderDetailsInfo.Any(od => od.MovieScheduleInfoEntity.MovieScheduleInfoId == ScheduleId && od.SeatId == s.SeatId)
                }).ToList()
            })
            .FirstOrDefaultAsync();

        return Ok(new BaseResponse<GetAuditoriumInfosRes>
        {
            Data = getAuditoriumDetails,
            IsSuccess = true,
            Message = "Response Here"
        });
    }
}
