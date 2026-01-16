using System.Security.Claims;
using Backend.Shard.Exceptions;
using BussinessLayer.Dtos;
using BussinessLayer.Dtos.Auditoriums.facilities_manager;
using BussinessLayer.Interfaces.i_Behaviors;
using DataAccess;
using DataAccess.Entities.Cinema_Infos;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace BussinessLayer.Use_cases.facilities_manager.Auditoriums;

public class facilitiesManagerWriteAuditoriumUseCase : IWriteBehavior<add_req_auditorium_dto, edit_req_auditorium_dto , string>
{
    private readonly dbContext _dbContext;
    
    private readonly IHttpContextAccessor  _httpContextAccessor;
    
    private readonly ILogger<facilitiesManagerWriteAuditoriumUseCase> _logger;


    public facilitiesManagerWriteAuditoriumUseCase(dbContext _dbContext
    ,  IHttpContextAccessor httpContextAccessor , ILogger<facilitiesManagerWriteAuditoriumUseCase> _logger)
    {
        this._dbContext = _dbContext;
        this._httpContextAccessor = httpContextAccessor;
        this._logger = _logger;
    }
    public async Task<base_reponse<string>> AddItem(add_req_auditorium_dto request)
    {
        var transactions = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            // Add auditorium
            if (Validates.auditoriumValidate.IsDuplicateAuditoriumNumber(_dbContext, null, request.auditoriumNumber,
                    request.cinemaId))
            {
                throw new app_exception("Error : Auditorium already exists", 400, "D01");
            }
            // Add Auditorimum
            Guid generateAuditoriumId = Guid.NewGuid();

            var newAuditoriumInfo = new auditorium_info_entity()
            {
                auditoriumId = generateAuditoriumId,
                cinemaId = request.cinemaId,
                auditoriumNumber = request.auditoriumNumber,
                movieFormatId = request.movieFormatId,
                createdAt = DateTime.Now,
                createdByUserId = Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(
                    ClaimTypes.Sid)?.Value)
            };

            await _dbContext.auditorium_info_entity.AddAsync(newAuditoriumInfo);

            List<seats_info_entity> seatsInfoEntities = new List<seats_info_entity>();
            foreach (var items in request.add_req_seats_auditorium_dto)
            {
                seatsInfoEntities.Add(new seats_info_entity()
                {
                    seatId = Guid.NewGuid(),
                    seatNumber = items.seatNumber,
                    coordX = items.coordX,
                    coordY = items.coordY,
                    colIndex = items.colIndex,
                    rowIndex = items.rowIndex,
                    createdAt = DateTime.Now ,
                    createdByUserId = Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(
                        ClaimTypes.Sid)?.Value) ,
                    auditoriumId = generateAuditoriumId
                });
            }

            await _dbContext.seats_info_entity.AddRangeAsync(seatsInfoEntities);
            
            await _dbContext.SaveChangesAsync();
            
            await transactions.CommitAsync();

            return new base_reponse<string>()
            {
                isSuccess = true,
                message = "Add Auditorium completed"
            };
        }
        catch (app_exception e)
        {
            await transactions.RollbackAsync();
            throw;
        }
        catch (Exception e)
        {
            await transactions.RollbackAsync();
            _logger.LogError("Database Error : Error Detail {0}" , e.Message);
            throw system_exception.system_exception_caller();
        }
    }

    public Task<base_reponse<string>> UpdateItem(Guid itemId, edit_req_auditorium_dto request)
    {
        return null!;
    }

    public Task<base_reponse<string>> DeleteItem(Guid itemId)
    {
        return null!;
    }
}