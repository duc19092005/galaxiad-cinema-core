using System.Security.Claims;
using Backend.Shard.Exceptions;
using BussinessLayer.Dtos;
using BussinessLayer.Dtos.cinemas;
using BussinessLayer.Interfaces.i_Behaviors;
using BussinessLayer.Validates;
using DataAccess;
using Microsoft.Extensions.Logging;
using DataAccess.Entities.Cinema_Infos;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace BussinessLayer.Use_cases.facilities_manager;

public class facilitiesManagerWriteCinemaUseCase : IWriteBehavior<add_cinema_req_dto ,edit_cinema_req_dto?, string>
{
    private readonly dbContext _dbContext;
    private ILogger<facilitiesManagerWriteCinemaUseCase> _logger;
    private IHttpContextAccessor  _httpContextAccessor;
    public facilitiesManagerWriteCinemaUseCase(dbContext dbContext, ILogger<facilitiesManagerWriteCinemaUseCase> logger ,
        IHttpContextAccessor httpContextAccessor)
    {
        this._dbContext = dbContext;
        this._logger = logger;
        this._httpContextAccessor = httpContextAccessor;
    }
    
    public async Task<base_reponse<string>> AddItem(add_cinema_req_dto request)
    {
        if (cinemaValidate.ValidateCinemaName(null,request.cinemaName, _dbContext))
        {
            throw new app_exception("Error : There's already a cinema named " + request.cinemaName ,
                StatusCodes.Status400BadRequest , "C01");
        }

        if (cinemaValidate.ValidateCinemaDescription(null,request.cinemaDescription, _dbContext))
        {
            throw new app_exception("Error : There's already a cinema Description " + request.cinemaDescription ,
                StatusCodes.Status400BadRequest , "C01");
        }

        if (cinemaValidate.ValidateCinemaLocation(null ,request.cinemaLocation, _dbContext))
        {
            throw new app_exception("Error : There's already a cinema Location " + request.cinemaLocation ,
                StatusCodes.Status400BadRequest , "C01");
        }

        if (cinemaValidate.ValidateCinemaHotLineNumber(null , request.cinemaHotlineNumber, _dbContext))
        {
            throw new app_exception("Error : There's already a cinema hotline Number " + request.cinemaHotlineNumber ,
                StatusCodes.Status400BadRequest , "C01");
        }

        try
        {
            Guid cinemaId = Guid.NewGuid();
            var newCinemaInfoEntity = new cinema_info_entity()
            {
                cinemaId = cinemaId,
                cinemaName = request.cinemaName,
                cinemaDescription = request.cinemaDescription,
                cinemaLocation = request.cinemaLocation,
                cinemaHotLineNumber = request.cinemaHotlineNumber,
                createdAt = DateTime.Now,
                createdByUserId = Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(
                    ClaimTypes.Sid)?.Value),
                managerId = Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(
                    ClaimTypes.Sid)?.Value),
                activeAt = request.activeAt ?? DateTime.Now,
                isActive = request.activeAt > DateTime.Now ? false : true,
            };
            await _dbContext.cinema_info_entity.AddAsync(newCinemaInfoEntity);
            await _dbContext.SaveChangesAsync();

            return new base_reponse<string>()
            {
                isSuccess = true,
                data = null,
                message = "Add Cinema Completed"
            };
        }
        catch (app_exception)
        {
            throw;
        }
        catch (Exception e)
        {
            _logger.LogError("There a Error with System : {0}" , e.Message);
            throw new app_exception("System Error", StatusCodes.Status500InternalServerError, "S01");
        }
    }

    public async Task<base_reponse<string>> UpdateItem(Guid itemId, edit_cinema_req_dto request)
    {
        // Find the cinema Infos
        try
        {
            var findCinema = await _dbContext.cinema_info_entity.FirstOrDefaultAsync(x => x.cinemaId.Equals(itemId));
            if (findCinema == null)
            {
                throw new app_exception("Error : There is no cinema with Id : " + itemId,
                    StatusCodes.Status404NotFound, "C01");
            }
            else
            {
                bool checkExitsDescription = request.cinemaDescription != null && cinemaValidate.ValidateCinemaDescription(findCinema.cinemaId,
                    request.cinemaDescription,_dbContext);
                
                bool checkExitsCinemaName = request.cinemaName != null && cinemaValidate.ValidateCinemaName(findCinema.cinemaId, request.cinemaName, _dbContext);
                
                bool checkExitsHotlineNumber = request.cinemaHotlineNumber != null && cinemaValidate.ValidateCinemaHotLineNumber(findCinema.cinemaId , request.cinemaHotlineNumber , _dbContext);
                
                bool checkExitsLocation = request.cinemaLocation != null && cinemaValidate.ValidateCinemaDescription(findCinema.cinemaId , request.cinemaLocation, _dbContext);

                if (checkExitsDescription)
                {
                    throw new app_exception("Error : There's already a cinema Description " + request.cinemaDescription ,
                        StatusCodes.Status400BadRequest , "C01");
                }

                if (checkExitsCinemaName)
                {
                    throw new app_exception("Error : There's already a cinema named " + request.cinemaName ,
                        StatusCodes.Status400BadRequest , "C01");
                }

                if (checkExitsHotlineNumber)
                {
                    throw new app_exception("Error : There's already a cinema hotline Number " + request.cinemaHotlineNumber ,
                        StatusCodes.Status400BadRequest , "C01");
                }

                if (checkExitsLocation)
                {
                    throw new app_exception("Error : There's already a cinema Location " + request.cinemaLocation ,
                        StatusCodes.Status400BadRequest , "C01");
                }
                
                findCinema.cinemaName = (!string.IsNullOrWhiteSpace(request.cinemaName)
                                         && !cinemaValidate.ValidateCinemaName(findCinema.cinemaId, request.cinemaName,
                                             _dbContext))
                    ? request.cinemaName
                    : findCinema.cinemaName;

                findCinema.cinemaDescription = (!string.IsNullOrWhiteSpace(request.cinemaDescription)
                                                && !cinemaValidate.ValidateCinemaDescription(findCinema.cinemaId,
                                                    request.cinemaDescription, _dbContext))
                    ? request.cinemaDescription
                    : findCinema.cinemaDescription;

                findCinema.cinemaHotLineNumber = (!string.IsNullOrWhiteSpace(request.cinemaHotlineNumber)
                                                  && !cinemaValidate.ValidateCinemaHotLineNumber(findCinema.cinemaId,
                                                      request.cinemaHotlineNumber, _dbContext))
                    ? request.cinemaHotlineNumber
                    : findCinema.cinemaHotLineNumber;

                findCinema.cinemaLocation = (!string.IsNullOrWhiteSpace(request.cinemaLocation)
                                             && !cinemaValidate.ValidateCinemaDescription(findCinema.cinemaId,
                                                 request.cinemaLocation, _dbContext))
                    ? request.cinemaLocation
                    : findCinema.cinemaLocation;
                
                findCinema.activeAt = request.activeAt ?? findCinema.activeAt;
                
                findCinema.updatedAt = DateTime.Now;

                findCinema.isActive = findCinema.activeAt < DateTime.Now;
                
                findCinema.updatedByUserId = Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(
                    ClaimTypes.Sid)?.Value);

                await _dbContext.SaveChangesAsync();

                return new base_reponse<string>()
                {
                    isSuccess = true,
                    data = null,
                    message = "Update Cinema Completed"
                };
            }
        }
        catch (app_exception)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new app_exception("System Error", StatusCodes.Status500InternalServerError, "S01");
        }
    }

    public async Task<base_reponse<string>> DeleteItem(Guid itemId)
    {
        return null!;
    }
}