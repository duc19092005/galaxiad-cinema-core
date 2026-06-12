using BusinessLayer.Dtos;
using BusinessLayer.Dtos.MovieManager.Responses;
using BusinessLayer.Interfaces.IBehaviors;
using Shared.Localization;
using BusinessLayer.Services.IdentityAccess;
using BusinessLayer.Entities.MovieInfos;
using BusinessLayer.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;
using Shared.Interfaces.Persistence;

namespace BusinessLayer.UseCases.MovieManager.MovieInfos;

public class ReadMovieInfoUseCase : IReadBehavior<ResGetMovieInfosMovieManagerDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserContextService _userContextService;

    public ReadMovieInfoUseCase(IUnitOfWork unitOfWork
    , IUserContextService userContextService)
    {
        this._unitOfWork = unitOfWork;
        this._userContextService = userContextService;
    }

    public async Task<BaseResponse<List<ResGetMovieInfosMovieManagerDto>>> GetAll()
    {
        // Find By User Id
        var findUserId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var movieRepository = _unitOfWork.Repository<MovieInfoEntity>();
        var movieCinemaRepository = _unitOfWork.Repository<MovieCinemaEntity>();
        var userRepository = _unitOfWork.Repository<UserInfoEntity>();

        var query = movieRepository.Query();
        if (!isAdmin)
        {
            query = query.Where(x => x.MovieManagerId == findUserId);
        }

        var getUserMovieInfos = await query
            .Select(x => new ResGetMovieInfosMovieManagerDto()
            {
                MovieId = x.MovieId,
                MovieDescriptions = x.MovieDescription,
                MovieGenresInfos = x.MovieGenreMovieInfoEntity
                    .Select(y => y.MovieGenreInfoEntity.MovieGenreName).ToList(),
                MovieImageUrl = x.MovieImageUrl,
                MovieName = x.MovieName,
                MovieVisualFormatInfos = x.MovieFormatMovieInfoEntity
                    .Select(y => y.MovieFormatInfoEntity.MovieFormatName).ToList(),
                MovieCinemas = movieCinemaRepository.Query()
                    .Where(mc => mc.MovieId == x.MovieId)
                    .Select(mc => new ResMovieCinemaDto { 
                        CinemaId = mc.CinemaId, 
                        CinemaName = mc.CinemaInfoEntity.CinemaName 
                    }).ToList(),
                Duration = x.MovieDuration ,
                EndedDate = DateTime.SpecifyKind(x.EndedDate, DateTimeKind.Utc),
                StartedDate = DateTime.SpecifyKind(x.ActiveAt, DateTimeKind.Utc),
                CreatedAt = DateTime.SpecifyKind(x.CreatedAt, DateTimeKind.Utc),
                UpdatedAt = DateTime.SpecifyKind(x.UpdatedAt, DateTimeKind.Utc),
                CreatedBy = userRepository.Query()
                    .Where(u => u.UserId == x.CreatedByUserId)
                    .Select(u => u.UserName)
                    .FirstOrDefault() ?? "System Administrator",
                UpdatedBy = x.UpdatedByUserId != null
                    ? userRepository.Query()
                        .Where(u => u.UserId == x.UpdatedByUserId)
                        .Select(u => u.UserName)
                        .FirstOrDefault() ?? ""
                    : "",
                TrailerUrl = x.TrailerUrl,
                Director = x.Director,
                Actors = x.Actors,
                MovieRequiredAgeSymbol = x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.Trim(),
                MovieManagerName = x.MovieManager != null ? x.MovieManager.UserName : "Chưa có"
            })
            .AsNoTracking()
            .ToListAsync();

        return new BaseResponse<List<ResGetMovieInfosMovieManagerDto>>()
        {
            IsSuccess = true,
            Data = getUserMovieInfos,
            Message = Messages.Movie.GetListSuccess
        };
    }

    public async Task<BaseResponse<ResGetMovieInfosMovieManagerDto>> GetById(Guid id)
    {
        Guid currentUserId = GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var movieRepository = _unitOfWork.Repository<MovieInfoEntity>();
        var movieCinemaRepository = _unitOfWork.Repository<MovieCinemaEntity>();
        var userRepository = _unitOfWork.Repository<UserInfoEntity>();

        var query = movieRepository.Query().Where(x => x.MovieId == id);
        if (!isAdmin)
        {
            query = query.Where(x => x.MovieManagerId == currentUserId);
        }

        var findMovieInfos = await query
            .Select(m => new ResGetMovieInfosMovieManagerDto()
            {
                MovieId = m.MovieId,
                MovieDescriptions = m.MovieDescription,
                MovieGenresInfos = m.MovieGenreMovieInfoEntity
                    .Select(y => y.MovieGenreInfoEntity.MovieGenreName).ToList(),
                MovieImageUrl = m.MovieImageUrl,
                MovieName = m.MovieName,
                MovieVisualFormatInfos = m.MovieFormatMovieInfoEntity
                    .Select(y => y.MovieFormatInfoEntity.MovieFormatName).ToList(),
                MovieCinemas = movieCinemaRepository.Query()
                    .Where(mc => mc.MovieId == m.MovieId)
                    .Select(mc => new ResMovieCinemaDto { 
                        CinemaId = mc.CinemaId, 
                        CinemaName = mc.CinemaInfoEntity.CinemaName 
                    }).ToList(),
                Duration = m.MovieDuration,
                EndedDate = DateTime.SpecifyKind(m.EndedDate, DateTimeKind.Utc),
                StartedDate = DateTime.SpecifyKind(m.ActiveAt, DateTimeKind.Utc),
                CreatedAt = DateTime.SpecifyKind(m.CreatedAt, DateTimeKind.Utc),
                UpdatedAt = DateTime.SpecifyKind(m.UpdatedAt, DateTimeKind.Utc),
                CreatedBy = userRepository.Query()
                    .Where(u => u.UserId == m.CreatedByUserId)
                    .Select(u => u.UserName)
                    .FirstOrDefault() ?? "System Administrator",
                UpdatedBy = m.UpdatedByUserId != null
                    ? userRepository.Query()
                        .Where(u => u.UserId == m.UpdatedByUserId)
                        .Select(u => u.UserName)
                        .FirstOrDefault() ?? ""
                    : "",
                TrailerUrl = m.TrailerUrl,
                Director = m.Director,
                Actors = m.Actors,
                MovieRequiredAgeSymbol = m.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.Trim(),
                MovieManagerName = m.MovieManager != null ? m.MovieManager.UserName : "Chưa có"
            }).FirstOrDefaultAsync();
        
        return new BaseResponse<ResGetMovieInfosMovieManagerDto>()
        {
            Data = findMovieInfos ,
            Message = Messages.Movie.GetInfoSuccess ,
            IsSuccess = true
        };

    }

    public async Task<BaseResponse<List<ResGetMovieInfosMovieManagerDto>>> GetByEntityName(string name)
    {
        return null!;
    }

    private Guid GetUserId()
    {
        return _userContextService.GetUserId();
    }
}


