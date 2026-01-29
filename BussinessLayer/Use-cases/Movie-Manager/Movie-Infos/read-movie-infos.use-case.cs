using System.Security.Claims;
using BussinessLayer.Dtos;
using BussinessLayer.Dtos.Movie_Manager;
using BussinessLayer.Interfaces.i_Behaviors;
using DataAccess;
using DataAccess.Entities.Movie_infos;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace BussinessLayer.Use_cases.Movie_Manager.Movie_Infos;

public class readMovieInfoUseCase : IReadBehavior<resGetMovieInfosMovieManagerDto>
{
    private readonly cinemaDbContext _dbContext;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public readMovieInfoUseCase(cinemaDbContext dbContext , IHttpContextAccessor httpContextAccessor)
    {
        this._dbContext = dbContext;
        this._httpContextAccessor = httpContextAccessor;
    }

    public async Task<baseResponse<List<resGetMovieInfosMovieManagerDto>>> GetAll()
    {
        // Find By User Id
        var findUserId = Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(
            ClaimTypes.Sid)?.Value);

        var getUserMovieInfos = await _dbContext.movieInfoEntity
            .Where(x => x.ManagerId.Equals(findUserId))
            .Select(x => new resGetMovieInfosMovieManagerDto()
            {
                MovieId = x.movieId,
                MovieDescriptions = x.movieDescription,
                MovieGenresInfos = x.movie_genre_movie_info_entity
                    .Select(x => x.movie_genre_info_entity.movieGenreName).ToList(),
                MovieImageUrl = x.movieImageUrl,
                MovieName = x.movieName,
                MovieVisualFormatInfos = x.movieFormatMovieInfoEntity
                    .Select(x => x.MovieFormatInfoEntity.movieFormatName).ToList()
            })
            .AsNoTracking()
            .ToListAsync();

        return new baseResponse<List<resGetMovieInfosMovieManagerDto>>()
        {
            isSuccess = true,
            data = getUserMovieInfos,
            message = "Get User Info Success"
        };
    }

    public async Task<baseResponse<resGetMovieInfosMovieManagerDto>> GetById(Guid id)
    {
        return null!;
    }

    public async Task<baseResponse<List<resGetMovieInfosMovieManagerDto>>> GetByEntityName(string name)
    {
        return null!;
    }
}