
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;
using Cinema.Domain.Entities.CinemaInfos;
using Microsoft.AspNetCore.Http;

namespace Cinema.Application.Validators;

public class CinemaValidate
{
    public static bool ValidateCinemaName(Guid? cinemaId, string cinemaName, IQueryable<CinemaInfoEntity> cinemas)
    {
        try
        {
            if (cinemaId == null)
            {
                return cinemas.Any(x => 
                    !x.IsDeleted && x.CinemaName.ToLower().Equals(cinemaName.ToLower()));
            }
            else
            {
                return cinemas.Any(x => 
                    !x.IsDeleted && x.CinemaId != cinemaId && x.CinemaName.ToLower().Equals(cinemaName.ToLower()));
            }
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new AppException(Messages.System.Error, StatusCodes.Status500InternalServerError, "S01");
        }
    }

    public static bool ValidateCinemaDescription(Guid? cinemaId, string cinemaDescriptions, IQueryable<CinemaInfoEntity> cinemas)
    {
        try
        {
            if (cinemaId == null)
            {
                return cinemas.Any(x => !x.IsDeleted && x.CinemaDescription.ToLower().Equals(cinemaDescriptions.ToLower()));
            }
            else
            {
                return cinemas.Any
                    (x => !x.IsDeleted 
                          && x.CinemaDescription.ToLower().Equals(cinemaDescriptions.ToLower())
                          && x.CinemaId != cinemaId);
            }
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new AppException(Messages.System.Error, StatusCodes.Status500InternalServerError, "S01");
        }
    }
    
    public static bool ValidateCinemaHotLineNumber(Guid? cinemaId, string hotlineNumber, IQueryable<CinemaInfoEntity> cinemas)
    {
        try
        {
            if (cinemaId == null)
            {
                return cinemas.Any(x => !x.IsDeleted && x.CinemaHotLineNumber.ToLower().Equals(hotlineNumber.ToLower()));
            }
            else
            {
                return cinemas.Any(x => !x.IsDeleted && x.CinemaHotLineNumber.ToLower().Equals(hotlineNumber.ToLower())
                && x.CinemaId != cinemaId);
            }
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new AppException(Messages.System.Error, StatusCodes.Status500InternalServerError, "S01");
        }
    }
    
    public static bool ValidateCinemaLocation(Guid? cinemaId, string cinemaLocation, IQueryable<CinemaInfoEntity> cinemas)
    {
        try
        {
            if (cinemaId == null)
            {
                return cinemas.Any(x => !x.IsDeleted && x.CinemaLocation.ToLower().Equals(cinemaLocation.ToLower()));
            }
            else
            {
                return cinemas.Any(x => !x.IsDeleted && x.CinemaLocation.ToLower().Equals(cinemaLocation.ToLower())
                && x.CinemaId != cinemaId);

            }
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new AppException(Messages.System.Error, StatusCodes.Status500InternalServerError, "S01");
        }
    }
}

