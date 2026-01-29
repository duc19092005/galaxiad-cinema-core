
using Shared.Exceptions;
using DataAccess;
using Microsoft.AspNetCore.Http;

namespace BusinessLayer.Validators;

public class CinemaValidate
{
    public static bool ValidateCinemaName(Guid? CinemaId ,string CinemaName , CinemaDbContext dbContext)
    {
        try
        {
            if (CinemaId == null)
            {
                return dbContext.CinemaInfoEntity.Any(x => 
                    !x.IsDeleted && x.CinemaName.ToLower().Equals(CinemaName.ToLower()));
            }
            else
            {
                return dbContext.CinemaInfoEntity.Any(x => 
                    !x.IsDeleted && x.CinemaId != CinemaId && x.CinemaName.ToLower().Equals(CinemaName.ToLower()));
            }
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception e)
        {
            throw new AppException("System Error", StatusCodes.Status500InternalServerError, "S01");
        }
    }

    public static bool ValidateCinemaDescription(Guid ? CinemaId,string CinemaDescriptions, CinemaDbContext dbContext)
    {
        try
        {
            if (CinemaId == null)
            {
                return dbContext.CinemaInfoEntity.Any(x => !x.IsDeleted && x.CinemaDescription.ToLower().Equals(CinemaDescriptions.ToLower()));
            }
            else
            {
                return dbContext.CinemaInfoEntity.Any
                    (x => !x.IsDeleted 
                          && x.CinemaDescription.ToLower().Equals(CinemaDescriptions.ToLower())
                          && x.CinemaId != CinemaId);
            }
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception e)
        {
            throw new AppException("System Error", StatusCodes.Status500InternalServerError, "S01");
        }
    }
    
    public static bool ValidateCinemaHotLineNumber(Guid ? CinemaId,string hotlineNumber, CinemaDbContext dbContext)
    {
        try
        {
            if (CinemaId == null)
            {
                return dbContext.CinemaInfoEntity.Any(x => !x.IsDeleted && x.CinemaHotLineNumber.ToLower().Equals(hotlineNumber.ToLower()));
            }
            else
            {
                return dbContext.CinemaInfoEntity.Any(x => !x.IsDeleted && x.CinemaHotLineNumber.ToLower().Equals(hotlineNumber.ToLower())
                && x.CinemaId != CinemaId);
            }
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception e)
        {
            throw new AppException("System Error", StatusCodes.Status500InternalServerError, "S01");
        }
    }
    
    public static bool ValidateCinemaLocation(Guid? CinemaId,string CinemaLocation, CinemaDbContext dbContext)
    {
        try
        {
            if (CinemaId == null)
            {
                return dbContext.CinemaInfoEntity.Any(x => !x.IsDeleted && x.CinemaLocation.ToLower().Equals(CinemaLocation.ToLower()));
            }
            else
            {
                return dbContext.CinemaInfoEntity.Any(x => !x.IsDeleted && x.CinemaLocation.ToLower().Equals(CinemaLocation.ToLower())
                && x.CinemaId != CinemaId);

            }
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception e)
        {
            throw new AppException("System Error", StatusCodes.Status500InternalServerError, "S01");
        }
    }
}

