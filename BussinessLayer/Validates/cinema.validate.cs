// ReSharper disable All

using Backend.Shard.Exceptions;
using DataAccess;
using Microsoft.AspNetCore.Http;

namespace BussinessLayer.Validates;

public class cinema_validate
{
    public static bool validateCinemaname(Guid? cinemaId ,string cinemaName , dbContext dbContext)
    {
        try
        {
            if (cinemaId == null)
            {
                return dbContext.cinema_info_entity.Any(x => 
                    !x.isDeleted && x.cinemaName.ToLower().Equals(cinemaName.ToLower()));
            }
            else
            {
                return dbContext.cinema_info_entity.Any(x => 
                    !x.isDeleted && x.cinemaId != cinemaId && x.cinemaName.ToLower().Equals(cinemaName.ToLower()));
            }
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

    public static bool validateCinemaDescription(Guid ? cinemaId,string cinemaDescriptions, dbContext dbContext)
    {
        try
        {
            if (cinemaId == null)
            {
                return dbContext.cinema_info_entity.Any(x => !x.isDeleted && x.cinemaDescription.ToLower().Equals(cinemaDescriptions.ToLower()));
            }
            else
            {
                return dbContext.cinema_info_entity.Any
                    (x => !x.isDeleted 
                          && x.cinemaDescription.ToLower().Equals(cinemaDescriptions.ToLower())
                          && x.cinemaId != cinemaId);
            }
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
    
    public static bool validateCinemaHotlinenumber(Guid ? cinemaId,string hotlineNumber, dbContext dbContext)
    {
        try
        {
            if (cinemaId == null)
            {
                return dbContext.cinema_info_entity.Any(x => !x.isDeleted && x.cinemaHotLineNumber.ToLower().Equals(hotlineNumber.ToLower()));
            }
            else
            {
                return dbContext.cinema_info_entity.Any(x => !x.isDeleted && x.cinemaHotLineNumber.ToLower().Equals(hotlineNumber.ToLower())
                && x.cinemaId != cinemaId);
            }
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
    
    public static bool validateCinemaLocation(Guid? cinemaId,string cinemaLocation, dbContext dbContext)
    {
        try
        {
            if (cinemaId == null)
            {
                return dbContext.cinema_info_entity.Any(x => !x.isDeleted && x.cinemaLocation.ToLower().Equals(cinemaLocation.ToLower()));
            }
            else
            {
                return dbContext.cinema_info_entity.Any(x => !x.isDeleted && x.cinemaLocation.ToLower().Equals(cinemaLocation.ToLower())
                && x.cinemaId != cinemaId);

            }
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