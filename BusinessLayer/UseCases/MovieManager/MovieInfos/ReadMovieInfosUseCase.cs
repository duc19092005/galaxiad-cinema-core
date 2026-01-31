using BusinessLayer.Dtos;
using BusinessLayer.Dtos.MovieManager;
using BusinessLayer.Interfaces.IBehaviors;
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

        var getUserMovieInfos = await _dbContext.MovieInfoEntity
            .Where(x => x.ManagerId.Equals(findUserId))
            .Select(x => new ResGetMovieInfosMovieManagerDto()
            {
                MovieId = x.MovieId,
                MovieDescriptions = x.MovieDescription,
                MovieGenresInfos = x.MovieGenreMovieInfoEntity
                    .Select(y => y.MovieGenreInfoEntity.MovieGenreName).ToList(),
                MovieImageUrl = x.MovieImageUrl,
                MovieName = x.MovieName,
                MovieVisualFormatInfos = x.MovieFormatMovieInfoEntity
                    .Select(y => y.MovieFormatInfoEntity.MovieFormatName).ToList()
            })
            .AsNoTracking()
            .ToListAsync();

        return new BaseResponse<List<ResGetMovieInfosMovieManagerDto>>()
        {
            IsSuccess = true,
            Data = getUserMovieInfos,
            Message = "Get Movies Info Success"
        };
    }

    public async Task<BaseResponse<ResGetMovieInfosMovieManagerDto>> GetById(Guid id)
    {
        Guid currentUserId = getUserId();

        var findMovieInfos = await _dbContext.MovieInfoEntity
            .Where(x => x.ManagerId == currentUserId)
            .Select(m => new ResGetMovieInfosMovieManagerDto()
            {
                MovieId = m.MovieId,
                MovieDescriptions = m.MovieDescription,
                MovieGenresInfos = m.MovieGenreMovieInfoEntity
                    .Select(y => y.MovieGenreInfoEntity.MovieGenreName).ToList(),
                MovieImageUrl = m.MovieImageUrl,
                MovieName = m.MovieName,
                MovieVisualFormatInfos = m.MovieFormatMovieInfoEntity
                    .Select(y => y.MovieFormatInfoEntity.MovieFormatName).ToList()
            }).FirstOrDefaultAsync();
        
        return new BaseResponse<ResGetMovieInfosMovieManagerDto>()
        {
            Data = findMovieInfos ,
            Message = "Get Movie Info Successfully" ,
            IsSuccess = true
        };

    }

    public async Task<BaseResponse<List<ResGetMovieInfosMovieManagerDto>>> GetByEntityName(string name)
    {
        return null!;
    }

    private Guid getUserId()
    {
        return _userContextService.GetUserId();
    }
}


