using System.Security.Claims;
using Shared.Exceptions;
using Shared.Localization;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.FacilitiesManager.Cinemas.Requests;
using BusinessLayer.Interfaces.IBehaviors;
using BusinessLayer.Services.Admin.Audit;
using BusinessLayer.Services.IdentityAccess;
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
    private readonly ILogger<FacilitiesManagerWriteCinemaUseCase> _logger;
    private readonly IUserContextService _userContext;
    private readonly AuditLogService _auditLogService;

    public FacilitiesManagerWriteCinemaUseCase(CinemaDbContext dbContext,
        ILogger<FacilitiesManagerWriteCinemaUseCase> logger,
        IUserContextService userContext,
        AuditLogService auditLogService)
    {
        this._dbContext = dbContext;
        this._logger = logger;
        _userContext = userContext;
        _auditLogService = auditLogService;
    }

    public async Task<BaseResponse<string>> AddItem(AddCinemaReqDto request)
    {
        Guid userId = GetUserId();
        
        var validationErrors = new List<string>();

        if (CinemaValidate.ValidateCinemaName(null, request.CinemaName, _dbContext))
        {
            validationErrors.Add(Messages.Cinema.AlreadyExistsName(request.CinemaName));
        }

        if (CinemaValidate.ValidateCinemaDescription(null, request.CinemaDescription, _dbContext))
        {
            validationErrors.Add(Messages.Cinema.AlreadyExistsDescription(request.CinemaDescription));
        }

        if (CinemaValidate.ValidateCinemaLocation(null, request.CinemaLocation, _dbContext))
        {
            validationErrors.Add(Messages.Cinema.AlreadyExistsLocation(request.CinemaLocation));
        }

        if (CinemaValidate.ValidateCinemaHotLineNumber(null, request.CinemaHotlineNumber, _dbContext))
        {
            validationErrors.Add(Messages.Cinema.AlreadyExistsHotline(request.CinemaHotlineNumber));
        }

        if (validationErrors.Any())
        {
            throw new BadRequestException(validationErrors, "C01");
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
                CinemaCity = request.CinemaCity,
                CinemaHotLineNumber = request.CinemaHotlineNumber,
                CreatedAt = DateTime.Now,
                CreatedByUserId = userId,
                FacilitiesManagerId = userId,
                TheaterManagerId = userId,
                ActiveAt = request.ActiveAt ?? DateTime.Now,
                IsActive = request.ActiveAt < DateTime.Now
            };
            await _dbContext.CinemaInfoEntity.AddAsync(newCinemaInfoEntity);
            await _auditLogService.WriteAsync(
                "Create",
                "Cinema",
                cinemaId,
                request.CinemaName,
                $"Created cinema {request.CinemaName}.",
                cinemaId);
            await _dbContext.SaveChangesAsync();

            return new BaseResponse<string>()
            {
                IsSuccess = true,
                Data = null,
                Message = Messages.Cinema.AddCompleted
            };
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception e)
        {
            _logger.LogError("There a Error with System : {0}", e.Message);
            throw new AppException(Messages.System.Error, StatusCodes.Status500InternalServerError, "S01");
        }
    }

    public async Task<BaseResponse<string>> UpdateItem(Guid itemId, EditCinemaReqDto request)
    {
        // Find the cinema Infos
        try
        {
            var userId = GetUserId();
            var isAdmin = _userContext.IsInRole("Admin");
            var findCinema = await _dbContext.CinemaInfoEntity.FirstOrDefaultAsync(x =>
                x.CinemaId.Equals(itemId) &&
                (isAdmin || x.FacilitiesManagerId == userId || x.TheaterManagerId == userId));
            if (findCinema == null)
            {
                throw new AppException(Messages.Cinema.NotFoundById(itemId),
                    StatusCodes.Status404NotFound, "C01");
            }
            else
            {
                var validationErrors = new List<string>();

                bool checkExitsDescription = request.CinemaDescription != null &&
                                             CinemaValidate.ValidateCinemaDescription(findCinema.CinemaId,
                                                 request.CinemaDescription, _dbContext);

                bool checkExitsCinemaName = request.CinemaName != null &&
                                            CinemaValidate.ValidateCinemaName(findCinema.CinemaId, request.CinemaName,
                                                _dbContext);

                bool checkExitsHotlineNumber = request.CinemaHotlineNumber != null &&
                                               CinemaValidate.ValidateCinemaHotLineNumber(findCinema.CinemaId,
                                                   request.CinemaHotlineNumber, _dbContext);

                bool checkExitsLocation = request.CinemaLocation != null &&
                                          CinemaValidate.ValidateCinemaDescription(findCinema.CinemaId,
                                              request.CinemaLocation, _dbContext);

                if (checkExitsDescription)
                {
                    validationErrors.Add(Messages.Cinema.AlreadyExistsDescription(request.CinemaDescription!));
                }

                if (checkExitsCinemaName)
                {
                    validationErrors.Add(Messages.Cinema.AlreadyExistsName(request.CinemaName!));
                }

                if (checkExitsHotlineNumber)
                {
                    validationErrors.Add(Messages.Cinema.AlreadyExistsHotline(request.CinemaHotlineNumber!));
                }

                if (checkExitsLocation)
                {
                    validationErrors.Add(Messages.Cinema.AlreadyExistsLocation(request.CinemaLocation!));
                }

                if (validationErrors.Any())
                {
                    throw new BadRequestException(validationErrors, "C01");
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

                findCinema.CinemaCity = (!string.IsNullOrWhiteSpace(request.CinemaCity))
                    ? request.CinemaCity
                    : findCinema.CinemaCity;

                findCinema.ActiveAt = request.ActiveAt ?? findCinema.ActiveAt;

                findCinema.UpdatedAt = DateTime.Now;

                findCinema.IsActive = findCinema.ActiveAt < DateTime.Now;

                findCinema.UpdatedByUserId = userId;

                await _auditLogService.WriteAsync(
                    "Update",
                    "Cinema",
                    findCinema.CinemaId,
                    findCinema.CinemaName,
                    $"Updated cinema {findCinema.CinemaName}.",
                    findCinema.CinemaId);

                await _dbContext.SaveChangesAsync();

                return new BaseResponse<string>()
                {
                    IsSuccess = true,
                    Data = null,
                    Message = Messages.Cinema.UpdateCompleted
                };
            }
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex.Message);
            throw new AppException(Messages.System.Error, StatusCodes.Status500InternalServerError, "S01");
        }
    }

    public async Task<BaseResponse<string>> DeleteItem(Guid itemId)
    {
        return null!;
    }

    private Guid GetUserId()
    {
        return _userContext.GetUserId();
    }

}

