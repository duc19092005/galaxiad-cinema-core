using BusinessLayer.Dtos;
using BusinessLayer.Dtos.MovieManager.Responses;
using BusinessLayer.Interfaces.IBehaviors;
using Shared.Localization;
using BusinessLayer.Services.IdentityAccess;
using DataAccess;
using Microsoft.EntityFrameworkCore;

namespace BusinessLayer.UseCases.MovieManager.MovieInfos;

public class ReadMovieInfoUseCase : IReadBehavior<ResGetMovieInfosMovieManagerDto>
{
    private readonly CinemaDbContext _dbContext;
    private readonly IUserContextService _userContextService;

    public ReadMovieInfoUseCase(CinemaDbContext dbContext
    , IUserContextService userContextService)
    {
        this._dbContext = dbContext;
        this._userContextService = userContextService;
    }

    public async Task<BaseResponse<List<ResGetMovieInfosMovieManagerDto>>> GetAll()
    {
        // Find By User Id
        var findUserId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var query = _dbContext.MovieInfoEntity.AsQueryable();
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
                MovieCinemas = _dbContext.MovieCinemaEntities
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
                CreatedBy = x.Creator != null ? x.Creator.UserProfileEntity.UserName : "System Administrator",
                UpdatedBy = x.Updater != null ? x.Updater.UserProfileEntity.UserName : "",
                TrailerUrl = x.TrailerUrl,
                Director = x.Director,
                Actors = x.Actors,
                MovieRequiredAgeSymbol = x.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.Trim(),
                MovieManagerName = x.MovieManager != null && x.MovieManager.UserProfileEntity != null ? x.MovieManager.UserProfileEntity.UserName : "Chưa có"
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

        var query = _dbContext.MovieInfoEntity.Where(x => x.MovieId == id);
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
                MovieCinemas = _dbContext.MovieCinemaEntities
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
                CreatedBy = m.Creator != null ? m.Creator.UserProfileEntity.UserName : "System Administrator",
                UpdatedBy = m.Updater != null ? m.Updater.UserProfileEntity.UserName : "",
                TrailerUrl = m.TrailerUrl,
                Director = m.Director,
                Actors = m.Actors,
                MovieRequiredAgeSymbol = m.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.Trim(),
                MovieManagerName = m.MovieManager != null && m.MovieManager.UserProfileEntity != null ? m.MovieManager.UserProfileEntity.UserName : "Chưa có"
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


