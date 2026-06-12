using BusinessLayer.Dtos;
using BusinessLayer.Services.IdentityAccess;
using BusinessLayer.Entities.CinemaInfos;
using BusinessLayer.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;
using Shared.Interfaces.Persistence;

namespace BusinessLayer.Services.TheaterManager;

public class TheaterManagerMovieOptionDto
{
    public Guid MovieId { get; set; }
    public string MovieName { get; set; } = string.Empty;
    public Guid FormatId { get; set; }
    public string FormatName { get; set; } = string.Empty;
}

public class TheaterManagerAuditoriumFormatOptionDto
{
    public Guid FormatId { get; set; }
    public string FormatName { get; set; } = string.Empty;
}

public class TheaterManagerAuditoriumOptionDto
{
    public Guid AuditoriumId { get; set; }
    public string AuditoriumNumber { get; set; } = string.Empty;
    public int TotalSeats { get; set; }
    public List<TheaterManagerAuditoriumFormatOptionDto> Formats { get; set; } = [];
}

public class TheaterManagerAuditoriumSelectionDto
{
    public string CinemaName { get; set; } = string.Empty;
    public List<TheaterManagerAuditoriumOptionDto> Auditoriums { get; set; } = [];
}

public class TheaterManagerDataService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserContextService _userContextService;

    public TheaterManagerDataService(IUnitOfWork unitOfWork, IUserContextService userContextService)
    {
        _unitOfWork = unitOfWork;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<List<TheaterManagerMovieOptionDto>>> GetMoviesWithFormatsAsync(Guid cinemaId)
    {
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var isManagerOfCinema = await Query<CinemaInfoEntity>()
            .AnyAsync(c => c.CinemaId == cinemaId && (c.TheaterManagerId == userId || c.FacilitiesManagerId == userId));

        if (!isAdmin && !isManagerOfCinema)
        {
            return new BaseResponse<List<TheaterManagerMovieOptionDto>>
            {
                IsSuccess = false,
                Message = "Ban khong co quyen quan ly rap nay."
            };
        }

        var authorizedMovieIds = await Query<MovieCinemaEntity>()
            .Where(mc => mc.CinemaId == cinemaId)
            .Select(mc => mc.MovieId)
            .ToListAsync();

        var movies = await Query<movieFormatMovieInfoEntity>()
            .Include(mf => mf.MovieInfoEntity)
            .Include(mf => mf.MovieFormatInfoEntity)
            .Where(mf => authorizedMovieIds.Contains(mf.MovieId) &&
                         !mf.MovieInfoEntity.IsDeleted &&
                         mf.MovieFormatInfoEntity.IsActive &&
                         !mf.MovieFormatInfoEntity.IsDeleted)
            .Select(mf => new TheaterManagerMovieOptionDto
            {
                MovieId = mf.MovieId,
                MovieName = mf.MovieInfoEntity.MovieName,
                FormatId = mf.FormatId,
                FormatName = mf.MovieFormatInfoEntity.MovieFormatName
            })
            .ToListAsync();

        return new BaseResponse<List<TheaterManagerMovieOptionDto>>
        {
            IsSuccess = true,
            Data = movies,
            Message = "Lay du lieu chon phim thanh cong"
        };
    }

    public async Task<BaseResponse<TheaterManagerAuditoriumSelectionDto>> GetMyAuditoriumsAsync(Guid? cinemaId)
    {
        var userId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var query = Query<CinemaInfoEntity>().AsNoTracking();

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
            return new BaseResponse<TheaterManagerAuditoriumSelectionDto>
            {
                IsSuccess = false,
                Message = cinemaId.HasValue
                    ? "Rap phim theo Id khong tim thay hoac ban khong co quyen quan ly."
                    : "Tai khoan cua ban chua duoc chi dinh quan ly rap phim nao."
            };
        }

        var auditoriums = await Query<AuditoriumInfoEntities>()
            .AsNoTracking()
            .Where(a => a.CinemaId == cinema.CinemaId && a.IsActive && !a.IsDeleted)
            .Select(a => new TheaterManagerAuditoriumOptionDto
            {
                AuditoriumId = a.AuditoriumId,
                AuditoriumNumber = a.AuditoriumNumber,
                TotalSeats = a.SeatsInfoEntity.Count,
                Formats = a.AuditoriumFormatInfosList.Select(af => new TheaterManagerAuditoriumFormatOptionDto
                {
                    FormatId = af.FormatId,
                    FormatName = af.MovieFormatInfoEntity.MovieFormatName
                }).ToList()
            })
            .ToListAsync();

        return new BaseResponse<TheaterManagerAuditoriumSelectionDto>
        {
            IsSuccess = true,
            Data = new TheaterManagerAuditoriumSelectionDto
            {
                CinemaName = cinema.CinemaName,
                Auditoriums = auditoriums
            },
            Message = "Lay du lieu phong chieu thanh cong."
        };
    }

    private IQueryable<TEntity> Query<TEntity>() where TEntity : class
    {
        return _unitOfWork.Repository<TEntity>().Query();
    }
}
