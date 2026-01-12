using Backend.Shard.Exceptions;
using BussinessLayer.Dtos;
using BussinessLayer.Dtos.cinemas.facilities_manager;
using BussinessLayer.Interfaces.i_Behaviors;
using DataAccess;
using Microsoft.EntityFrameworkCore;

namespace BussinessLayer.Use_cases.facilities_manager;

public class read_use_case_facilities_manager : i_read_behavior<res_facilities_manager_cinema>
{
    private readonly dbContext _dbContext;

    public read_use_case_facilities_manager(dbContext _dbContext)
    {
        this._dbContext = _dbContext;
    }
    
    public async Task<base_reponse<List<res_facilities_manager_cinema>>> getAll()
    {
        try
        {
            var getResults = await _dbContext.cinema_info_entity.Select(x => new res_facilities_manager_cinema()
            {
                cinemaId = x.cinemaId,
                cinemaLocation = x.cinemaLocation,
                cinemaDescription = x.cinemaDescription,
                cinemaName = x.cinemaName,
                cinemaHotlineNumber = x.cinemaHotLineNumber,
                totalRooms = x.auditorium_info_entity.Count
            }).ToListAsync();

            return new base_reponse<List<res_facilities_manager_cinema>>()
            {
                isSuccess = true,
                data = getResults,
                message = "Get Cinema List SuccessFully"
            };
        }
        catch (app_exception)
        {
            throw;
        }
        catch (Exception e)
        {
             throw system_exception.system_exception_caller();
        }
    }

    public async Task<base_reponse<res_facilities_manager_cinema>> getById(Guid id)
    {
        return null!;
    }

    public Task<base_reponse<List<res_facilities_manager_cinema>>> getByEntityName(string name)
    {
        return null!;
    }
}