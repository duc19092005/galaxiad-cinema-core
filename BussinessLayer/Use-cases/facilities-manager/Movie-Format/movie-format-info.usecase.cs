using Backend.Shard.Exceptions;
using BussinessLayer.Dtos;
using BussinessLayer.Dtos.Movie_Infos.Movie_Format;
using BussinessLayer.Interfaces.i_Behaviors;
using DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BussinessLayer.Use_cases.facilities_manager.Movie_Format;

public class facilities_manager_movie_format_info_usecase : i_read_behavior<facilities_manager_res_movie_format_dto>
{
    private readonly dbContext _dbContext;
    private readonly ILogger<facilities_manager_movie_format_info_usecase> _logger;

    public facilities_manager_movie_format_info_usecase(dbContext dbContext
    ,ILogger<facilities_manager_movie_format_info_usecase> _logger)
    {
        this._dbContext = dbContext;
        this._logger = _logger;
    }
    public async Task<base_reponse<List<facilities_manager_res_movie_format_dto>>> getAll()
    {
        try
        {
            var results = await _dbContext.movie_format_info_entity.Select(x =>
                new facilities_manager_res_movie_format_dto()
                {
                    formatId = x.movieFormatId,
                    formatDescription = x.movieFormatDescription,
                    formatName = x.movieFormatName,
                    movieFormatPrice = x.movieFormatPrice
                }).ToListAsync();

            return new base_reponse<List<facilities_manager_res_movie_format_dto>>
            {
                isSuccess = true,
                data = results,
                message = "Movie Format Datas"
            };
        }
        catch (app_exception)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);
            throw system_exception.system_exception_caller();
        }
    }

    public async Task<base_reponse<facilities_manager_res_movie_format_dto>> getById(Guid id)
    {
        return null!;
    }

    public async Task<base_reponse<List<facilities_manager_res_movie_format_dto>>> getByEntityName(string name)
    {
        return null!;
    }
}