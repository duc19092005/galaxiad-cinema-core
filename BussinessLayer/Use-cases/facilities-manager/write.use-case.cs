using System.Security.Claims;
using Backend.Shard.Exceptions;
using BussinessLayer.Dtos;
using BussinessLayer.Dtos.cinemas;
using BussinessLayer.Interfaces.i_Behaviors;
using BussinessLayer.Validates;
using DataAccess;
using Microsoft.Extensions.Logging;
using DataAccess.Entities.Cinema_Infos;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Http;

namespace BussinessLayer.Use_cases.facilities_manager;

public class write_use_case : i_write_behavior<add_cinema_req_dto ,edit_cinema_req_dto?, string>
{
    private readonly dbContext _dbContext;
    private ILogger<write_use_case> _logger;
    private IHttpContextAccessor  _httpContextAccessor;

    public write_use_case(dbContext dbContext, ILogger<write_use_case> logger ,
        IHttpContextAccessor httpContextAccessor)
    {
        this._dbContext = dbContext;
        this._logger = logger;
        this._httpContextAccessor = httpContextAccessor;
    }
    
    public async Task<base_reponse<string>> AddItem(add_cinema_req_dto request)
    {
        if (cinema_validate.validateCinemaname(request.cinemaName, _dbContext))
        {
            throw new app_exception("Error : There's already a cinema named " + request.cinemaName ,
                StatusCodes.Status400BadRequest , "C01");
        }

        if (cinema_validate.validateCinemaDescription(request.cinemaDescription, _dbContext))
        {
            throw new app_exception("Error : There's already a cinema Description " + request.cinemaDescription ,
                StatusCodes.Status400BadRequest , "C01");
        }

        if (cinema_validate.validateCinemaLocation(request.cinemaLocation, _dbContext))
        {
            throw new app_exception("Error : There's already a cinema Location " + request.cinemaLocation ,
                StatusCodes.Status400BadRequest , "C01");
        }

        if (cinema_validate.validateCinemaHotlinenumber(request.cinemaHotlineNumber, _dbContext))
        {
            throw new app_exception("Error : There's already a cinema hotline Number " + request.cinemaHotlineNumber ,
                StatusCodes.Status400BadRequest , "C01");
        }

        try
        {
            Guid cinemaId = Guid.NewGuid();
            await _dbContext.cinema_info_entity.AddAsync(new cinema_info_entity()
            {
                cinemaId = cinemaId,
                cinemaName = request.cinemaName,
                cinemaDescription = request.cinemaDescription,
                cinemaLocation = request.cinemaLocation,
                cinemaHotLineNumber = request.cinemaHotlineNumber,
                createdAt = request.releaseDate ,
                createdByUserId = Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(
                    ClaimTypes.Sid)?.Value)
            });
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
        return null!;
    }

    public async Task<base_reponse<string>> DeleteItem(Guid itemId)
    {
        return null!;
    }
}