using Backend.Shard.Exceptions;
using BussinessLayer.Dtos;
using BussinessLayer.Dtos.cinemas.facilities_manager;
using BussinessLayer.Interfaces.i_Behaviors;
using DataAccess;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace BussinessLayer.Use_cases.facilities_manager;

public class facilitiesManagerReadCinemaUseCase : IReadBehavior<res_facilities_manager_cinema>
{
    private readonly dbContext _dbContext;

    public facilitiesManagerReadCinemaUseCase(dbContext _dbContext)
    {
        this._dbContext = _dbContext;
    }
    
    public async Task<base_reponse<List<res_facilities_manager_cinema>>> GetAll()
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

    public async Task<base_reponse<res_facilities_manager_cinema>> GetById(Guid id)
    {
        try
        {
            var cinemaData = await _dbContext.cinema_info_entity
                .Where(x => x.cinemaId == id)
                .Select(x => new res_facilities_manager_cinema
                {
                    cinemaId = x.cinemaId,
                    cinemaName = x.cinemaName,
                    cinemaDescription = x.cinemaDescription,
                    cinemaLocation = x.cinemaLocation,
                    cinemaHotlineNumber = x.cinemaHotLineNumber,
                    // EF Core sẽ dịch dòng này thành SELECT COUNT(*) từ bảng Auditorium
                    totalRooms = x.auditorium_info_entity.Count 
                })
                .FirstOrDefaultAsync();

            if (cinemaData == null)
            {
                throw new app_exception("Sorry, We can not find the cinema",
                    StatusCodes.Status404NotFound, "NotFound01");
            }

            return new base_reponse<res_facilities_manager_cinema>()
            {
                isSuccess = true,
                data = cinemaData,
                message = "Cinema Infos"
            };
        }
        catch (Exception)
        {
            throw;
        }
    }

    public Task<base_reponse<List<res_facilities_manager_cinema>>> GetByEntityName(string name)
    {
        return null!;
    }
}