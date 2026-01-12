// ReSharper disable All

using Backend.Shard.Exceptions;
using DataAccess;
using Microsoft.AspNetCore.Http;

namespace BussinessLayer.Validates;

public class cinema_validate
{
    public static bool validateCinemaname(string cinemaName , dbContext dbContext)
    {
        try
        {
            return dbContext.cinema_info_entity.Any(x => 
                !x.isDeleted && x.cinemaName.ToLower().Equals(cinemaName.ToLower()));
        }
        catch (app_exception)
        {
            throw;
        }
        catch (Exception e)
        {
            throw new app_exception("System Error", StatusCodes.Status500InternalServerError, "S01");
        }
    }

    public static bool validateCinemaDescription(string cinemaDescriptions, dbContext dbContext)
    {
        try
        {
            return dbContext.cinema_info_entity.Any(x => !x.isDeleted && x.cinemaDescription.ToLower().Equals(cinemaDescriptions.ToLower()));
        }
        catch (app_exception)
        {
            throw;
        }
        catch (Exception e)
        {
            throw new app_exception("System Error", StatusCodes.Status500InternalServerError, "S01");
        }
    }
    
    public static bool validateCinemaHotlinenumber(string hotlineNumber, dbContext dbContext)
    {
        try
        {
            return dbContext.cinema_info_entity.Any(x => !x.isDeleted && x.cinemaHotLineNumber.ToLower().Equals(hotlineNumber.ToLower()));
        }
        catch (app_exception)
        {
            throw;
        }
        catch (Exception e)
        {
            throw new app_exception("System Error", StatusCodes.Status500InternalServerError, "S01");
        }
    }
    
    public static bool validateCinemaLocation(string cinemaLocation, dbContext dbContext)
    {
        try
        {
            return dbContext.cinema_info_entity.Any(x => !x.isDeleted && x.cinemaLocation.ToLower().Equals(cinemaLocation.ToLower()));
        }
        catch (app_exception)
        {
            throw;
        }
        catch (Exception e)
        {
            throw new app_exception("System Error", StatusCodes.Status500InternalServerError, "S01");
        }
    }
}