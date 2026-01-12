using Backend.Shard.Exceptions;
using BussinessLayer.Dtos;
using BussinessLayer.Dtos.cinemas.facilities_manager;
using BussinessLayer.Interfaces.i_Behaviors;
using DataAccess;
using Microsoft.AspNetCore.Http;
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
        try
        {
            var cinemaInformation = await _dbContext.cinema_info_entity.FirstOrDefaultAsync(x => x.cinemaId == id);
            if (cinemaInformation == null)
            {
                throw new app_exception("Sorry , We can not find the cinema please try another cinema",
                    StatusCodes.Status404NotFound, "NotFound01");
            }

            return new base_reponse<res_facilities_manager_cinema>()
            {
                isSuccess = true,
                data = new res_facilities_manager_cinema()
                {
                    cinemaDescription = cinemaInformation.cinemaDescription,
                    cinemaId = cinemaInformation.cinemaId,
                    cinemaLocation = cinemaInformation.cinemaLocation,
                    cinemaName = cinemaInformation.cinemaName,
                    cinemaHotlineNumber = cinemaInformation.cinemaHotLineNumber,
                    totalRooms = cinemaInformation.auditorium_info_entity.Count
                },
                message = "Cinema Infos"
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

    public Task<base_reponse<List<res_facilities_manager_cinema>>> getByEntityName(string name)
    {
        return null!;
    }
}