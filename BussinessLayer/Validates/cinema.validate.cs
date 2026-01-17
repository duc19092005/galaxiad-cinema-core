
using Backend.Shard.Exceptions;
using DataAccess;
using Microsoft.AspNetCore.Http;

namespace BussinessLayer.Validates;

public class cinemaValidate
{
    public static bool ValidateCinemaName(Guid? cinemaId ,string cinemaName , cinemaDbContext dbContext)
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
        catch (appException)
        {
            throw;
        }
        catch (Exception e)
        {
            throw new appException("System Error", StatusCodes.Status500InternalServerError, "S01");
        }
    }

    public static bool ValidateCinemaDescription(Guid ? cinemaId,string cinemaDescriptions, cinemaDbContext dbContext)
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
        catch (appException)
        {
            throw;
        }
        catch (Exception e)
        {
            throw new appException("System Error", StatusCodes.Status500InternalServerError, "S01");
        }
    }
    
    public static bool ValidateCinemaHotLineNumber(Guid ? cinemaId,string hotlineNumber, cinemaDbContext dbContext)
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
        catch (appException)
        {
            throw;
        }
        catch (Exception e)
        {
            throw new appException("System Error", StatusCodes.Status500InternalServerError, "S01");
        }
    }
    
    public static bool ValidateCinemaLocation(Guid? cinemaId,string cinemaLocation, cinemaDbContext dbContext)
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
        catch (appException)
        {
            throw;
        }
        catch (Exception e)
        {
            throw new appException("System Error", StatusCodes.Status500InternalServerError, "S01");
        }
    }
}