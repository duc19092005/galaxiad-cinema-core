using System.Security.Claims;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.MovieManager;
using BusinessLayer.Interfaces.IBehaviors;
using DataAccess;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace BusinessLayer.UseCases.MovieManager.MovieInfos;

public class ReadMovieInfoUseCase : IReadBehavior<ResGetMovieInfosMovieManagerDto>
{
    private readonly CinemaDbContext _dbContext;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ReadMovieInfoUseCase(CinemaDbContext dbContext , IHttpContextAccessor httpContextAccessor)
    {
        this._dbContext = dbContext;
        this._httpContextAccessor = httpContextAccessor;
    }

    public async Task<BaseResponse<List<ResGetMovieInfosMovieManagerDto>>> GetAll()
    {
        // Find By User Id
        var findUserId = Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(
            ClaimTypes.Sid)?.Value);

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
            Message = "Get User Info Success"
        };
    }

    public async Task<BaseResponse<ResGetMovieInfosMovieManagerDto>> GetById(Guid id)
    {
        return null!;
    }

    public async Task<BaseResponse<List<ResGetMovieInfosMovieManagerDto>>> GetByEntityName(string name)
    {
        return null!;
    }
}


