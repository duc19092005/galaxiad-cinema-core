using System.Security.Claims;
using Shared.Exceptions;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.Cinemas;
using BusinessLayer.Interfaces.IBehaviors;
using BusinessLayer.Validators;
using DataAccess;
using Microsoft.Extensions.Logging;
using DataAccess.Entities.CinemaInfos;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace BusinessLayer.UseCases.FacilitiesManager.Cinemas;

public class FacilitiesManagerWriteCinemaUseCase : IWriteBehavior<AddCinemaReqDto, EditCinemaReqDto, string>
{
    private readonly CinemaDbContext _dbContext;
    private ILogger<FacilitiesManagerWriteCinemaUseCase> _logger;
    private IHttpContextAccessor  _httpContextAccessor;
    public FacilitiesManagerWriteCinemaUseCase(CinemaDbContext dbContext, ILogger<FacilitiesManagerWriteCinemaUseCase> logger ,
        IHttpContextAccessor httpContextAccessor)
    {
        this._dbContext = dbContext;
        this._logger = logger;
        this._httpContextAccessor = httpContextAccessor;
    }
    
    public async Task<BaseResponse<string>> AddItem(AddCinemaReqDto request)
    {
        if (CinemaValidate.ValidateCinemaName(null, request.CinemaName, _dbContext))
        {
            throw new AppException("Error : There's already a cinema named " + request.CinemaName ,
                StatusCodes.Status400BadRequest , "C01");
        }

        if (CinemaValidate.ValidateCinemaDescription(null, request.CinemaDescription, _dbContext))
        {
            throw new AppException("Error : There's already a cinema Description " + request.CinemaDescription ,
                StatusCodes.Status400BadRequest , "C01");
        }

        if (CinemaValidate.ValidateCinemaLocation(null , request.CinemaLocation, _dbContext))
        {
            throw new AppException("Error : There's already a cinema Location " + request.CinemaLocation ,
                StatusCodes.Status400BadRequest , "C01");
        }

        if (CinemaValidate.ValidateCinemaHotLineNumber(null , request.CinemaHotlineNumber, _dbContext))
        {
            throw new AppException("Error : There's already a cinema hotline Number " + request.CinemaHotlineNumber ,
                StatusCodes.Status400BadRequest , "C01");
        }

        try
        {
            Guid cinemaId = Guid.NewGuid();
            var newCinemaInfoEntity = new CinemaInfoEntity()
            {
                CinemaId = cinemaId,
                CinemaName = request.CinemaName,
                CinemaDescription = request.CinemaDescription,
                CinemaLocation = request.CinemaLocation,
                CinemaHotLineNumber = request.CinemaHotlineNumber,
                CreatedAt = DateTime.Now,
                CreatedByUserId = Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(
                    ClaimTypes.Sid)?.Value),
                ManagerId = Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(
                    ClaimTypes.Sid)?.Value),
                ActiveAt = request.ActiveAt ?? DateTime.Now,
                IsActive = request.ActiveAt > DateTime.Now ? false : true,
            };
            await _dbContext.CinemaInfoEntity.AddAsync(newCinemaInfoEntity);
            await _dbContext.SaveChangesAsync();

            return new BaseResponse<string>()
            {
                IsSuccess = true,
                Data = null,
                Message = "Add Cinema Completed"
            };
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception e)
        {
            _logger.LogError("There a Error with System : {0}" , e.Message);
            throw new AppException("System Error", StatusCodes.Status500InternalServerError, "S01");
        }
    }

    public async Task<BaseResponse<string>> UpdateItem(Guid itemId, EditCinemaReqDto request)
    {
        // Find the cinema Infos
        try
        {
            var findCinema = await _dbContext.CinemaInfoEntity.FirstOrDefaultAsync(x => x.CinemaId.Equals(itemId));
            if (findCinema == null)
            {
                throw new AppException("Error : There is no cinema with Id : " + itemId,
                    StatusCodes.Status404NotFound, "C01");
            }
            else
            {
                bool checkExitsDescription = request.CinemaDescription != null && CinemaValidate.ValidateCinemaDescription(findCinema.CinemaId,
                    request.CinemaDescription, _dbContext);
                
                bool checkExitsCinemaName = request.CinemaName != null && CinemaValidate.ValidateCinemaName(findCinema.CinemaId, request.CinemaName, _dbContext);
                
                bool checkExitsHotlineNumber = request.CinemaHotlineNumber != null && CinemaValidate.ValidateCinemaHotLineNumber(findCinema.CinemaId , request.CinemaHotlineNumber , _dbContext);
                
                bool checkExitsLocation = request.CinemaLocation != null && CinemaValidate.ValidateCinemaDescription(findCinema.CinemaId , request.CinemaLocation, _dbContext);

                if (checkExitsDescription)
                {
                    throw new AppException("Error : There's already a cinema Description " + request.CinemaDescription ,
                        StatusCodes.Status400BadRequest , "C01");
                }

                if (checkExitsCinemaName)
                {
                    throw new AppException("Error : There's already a cinema named " + request.CinemaName ,
                        StatusCodes.Status400BadRequest , "C01");
                }

                if (checkExitsHotlineNumber)
                {
                    throw new AppException("Error : There's already a cinema hotline Number " + request.CinemaHotlineNumber ,
                        StatusCodes.Status400BadRequest , "C01");
                }

                if (checkExitsLocation)
                {
                    throw new AppException("Error : There's already a cinema Location " + request.CinemaLocation ,
                        StatusCodes.Status400BadRequest , "C01");
                }
                
                findCinema.CinemaName = (!string.IsNullOrWhiteSpace(request.CinemaName)
                                         && !CinemaValidate.ValidateCinemaName(findCinema.CinemaId, request.CinemaName,
                                             _dbContext))
                    ? request.CinemaName
                    : findCinema.CinemaName;

                findCinema.CinemaDescription = (!string.IsNullOrWhiteSpace(request.CinemaDescription)
                                                && !CinemaValidate.ValidateCinemaDescription(findCinema.CinemaId,
                                                    request.CinemaDescription, _dbContext))
                    ? request.CinemaDescription
                    : findCinema.CinemaDescription;

                findCinema.CinemaHotLineNumber = (!string.IsNullOrWhiteSpace(request.CinemaHotlineNumber)
                                                  && !CinemaValidate.ValidateCinemaHotLineNumber(findCinema.CinemaId,
                                                      request.CinemaHotlineNumber, _dbContext))
                    ? request.CinemaHotlineNumber
                    : findCinema.CinemaHotLineNumber;

                findCinema.CinemaLocation = (!string.IsNullOrWhiteSpace(request.CinemaLocation)
                                             && !CinemaValidate.ValidateCinemaDescription(findCinema.CinemaId,
                                                 request.CinemaLocation, _dbContext))
                    ? request.CinemaLocation
                    : findCinema.CinemaLocation;
                
                findCinema.ActiveAt = request.ActiveAt ?? findCinema.ActiveAt;
                
                findCinema.UpdatedAt = DateTime.Now;

                findCinema.IsActive = findCinema.ActiveAt < DateTime.Now;
                
                findCinema.UpdatedByUserId = Guid.Parse(_httpContextAccessor.HttpContext.User.FindFirst(
                    ClaimTypes.Sid)?.Value);

                await _dbContext.SaveChangesAsync();

                return new BaseResponse<string>()
                {
                    IsSuccess = true,
                    Data = null,
                    Message = "Update Cinema Completed"
                };
            }
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new AppException("System Error", StatusCodes.Status500InternalServerError, "S01");
        }
    }

    public async Task<BaseResponse<string>> DeleteItem(Guid itemId)
    {
        return null!;
    }
}

