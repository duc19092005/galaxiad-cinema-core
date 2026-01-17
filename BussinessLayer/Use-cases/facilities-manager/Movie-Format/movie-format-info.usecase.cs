using Backend.Shard.Exceptions;
using BussinessLayer.Dtos;
using BussinessLayer.Dtos.facilities_manager.Movie_Infos.Movie_Format;
using BussinessLayer.Interfaces.i_Behaviors;
using DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BussinessLayer.Use_cases.facilities_manager.Movie_Format;

public class facilitiesManagerReadMovieFormatUseCase : IReadBehavior<resFacilitiesManagerMovieFormatDto>
{
    private readonly cinemaDbContext _dbContext;
    private readonly ILogger<facilitiesManagerReadMovieFormatUseCase> _logger;

    public facilitiesManagerReadMovieFormatUseCase(cinemaDbContext dbContext
    ,ILogger<facilitiesManagerReadMovieFormatUseCase> _logger)
    {
        this._dbContext = dbContext;
        this._logger = _logger;
    }
    public async Task<baseResponse<List<resFacilitiesManagerMovieFormatDto>>> GetAll()
    {
        try
        {
            var results = await _dbContext.movie_format_info_entity.Select(x =>
                new resFacilitiesManagerMovieFormatDto()
                {
                    formatId = x.movieFormatId,
                    formatDescription = x.movieFormatDescription,
                    formatName = x.movieFormatName,
                    movieFormatPrice = x.movieFormatPrice
                }).ToListAsync();

            return new baseResponse<List<resFacilitiesManagerMovieFormatDto>>
            {
                isSuccess = true,
                data = results,
                message = "Movie Format Datas"
            };
        }
        catch (appException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);
            throw systemException.SystemExceptionCaller();
        }
    }

    public async Task<baseResponse<resFacilitiesManagerMovieFormatDto>> GetById(Guid id)
    {
        return null!;
    }

    public async Task<baseResponse<List<resFacilitiesManagerMovieFormatDto>>> GetByEntityName(string name)
    {
        return null!;
    }
}