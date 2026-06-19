using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Localization;
using Cinema.Domain.Utils;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.FacilitiesManager.Cinemas.Requests;
using Cinema.Application.Interfaces.IBehaviors;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Entities.CinemaInfos;
using Microsoft.AspNetCore.Http;
using Cinema.Application.Interfaces.Facilities;

namespace Cinema.Application.UseCases.FacilitiesManager.Cinemas;

public class FacilitiesManagerWriteCinemaUseCase : IWriteBehavior<AddCinemaReqDto, EditCinemaReqDto, string>
{
    private readonly ICinemaRepository _repository;
    private readonly ILogger<FacilitiesManagerWriteCinemaUseCase> _logger;
    private readonly IUserContextService _userContext;
    private readonly IAuditLogService _auditLogService;

    public FacilitiesManagerWriteCinemaUseCase(
        ICinemaRepository repository,
        ILogger<FacilitiesManagerWriteCinemaUseCase> logger,
        IUserContextService userContext,
        IAuditLogService auditLogService)
    {
        _repository = repository;
        _logger = logger;
        _userContext = userContext;
        _auditLogService = auditLogService;
    }

    public async Task<BaseResponse<string>> AddItem(AddCinemaReqDto request)
    {
        Guid userId = GetUserId();
        
        var validationErrors = new List<string>();

        if (await _repository.IsDuplicateCinemaNameAsync(null, request.CinemaName))
        {
            validationErrors.Add(Messages.Cinema.AlreadyExistsName(request.CinemaName));
        }

        if (await _repository.IsDuplicateCinemaDescriptionAsync(null, request.CinemaDescription))
        {
            validationErrors.Add(Messages.Cinema.AlreadyExistsDescription(request.CinemaDescription));
        }

        if (await _repository.IsDuplicateCinemaLocationAsync(null, request.CinemaLocation))
        {
            validationErrors.Add(Messages.Cinema.AlreadyExistsLocation(request.CinemaLocation));
        }

        if (await _repository.IsDuplicateCinemaHotlineAsync(null, request.CinemaHotlineNumber))
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
            var activeAt = DateTimeHelper.NormalizeIncoming(request.ActiveAt) ?? DateTime.UtcNow;
            var isAdmin = _userContext.IsInRole("Admin");
            var newCinemaInfoEntity = new CinemaInfoEntity
            {
                CinemaId = cinemaId,
                CinemaName = request.CinemaName,
                CinemaDescription = request.CinemaDescription,
                CinemaLocation = request.CinemaLocation,
                CinemaCity = request.CinemaCity,
                CinemaHotLineNumber = request.CinemaHotlineNumber,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = userId,
                FacilitiesManagerId = isAdmin ? null : userId,
                TheaterManagerId = isAdmin ? null : userId,
                ActiveAt = activeAt,
                IsActive = activeAt < DateTime.UtcNow
            };
            await _repository.AddCinemaAsync(newCinemaInfoEntity);
            await _auditLogService.WriteAsync(
                "Create",
                "Cinema",
                cinemaId,
                request.CinemaName,
                $"Created cinema {request.CinemaName}.",
                cinemaId);
            await _repository.SaveChangesAsync();

            return new BaseResponse<string>
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
        try
        {
            var userId = GetUserId();
            var isAdmin = _userContext.IsInRole("Admin");
            var findCinema = await _repository.GetCinemaEntityByIdAsync(itemId, userId, isAdmin);
            if (findCinema == null)
            {
                throw new AppException(Messages.Cinema.NotFoundById(itemId),
                    StatusCodes.Status404NotFound, "C01");
            }
            
            var hasBookedBookings = await _repository.HasBookedBookingForCinemaAsync(itemId);
            if (hasBookedBookings)
            {
                throw new AppException(
                    Messages.Cinema.CannotEditActiveBookings,
                    StatusCodes.Status409Conflict,
                    "C02");
            }

            var validationErrors = new List<string>();

            if (request.CinemaDescription != null && await _repository.IsDuplicateCinemaDescriptionAsync(findCinema.CinemaId, request.CinemaDescription))
            {
                validationErrors.Add(Messages.Cinema.AlreadyExistsDescription(request.CinemaDescription));
            }

            if (request.CinemaName != null && await _repository.IsDuplicateCinemaNameAsync(findCinema.CinemaId, request.CinemaName))
            {
                validationErrors.Add(Messages.Cinema.AlreadyExistsName(request.CinemaName));
            }

            if (request.CinemaHotlineNumber != null && await _repository.IsDuplicateCinemaHotlineAsync(findCinema.CinemaId, request.CinemaHotlineNumber))
            {
                validationErrors.Add(Messages.Cinema.AlreadyExistsHotline(request.CinemaHotlineNumber));
            }

            if (request.CinemaLocation != null && await _repository.IsDuplicateCinemaLocationAsync(findCinema.CinemaId, request.CinemaLocation))
            {
                validationErrors.Add(Messages.Cinema.AlreadyExistsLocation(request.CinemaLocation));
            }

            if (validationErrors.Any())
            {
                throw new BadRequestException(validationErrors, "C01");
            }

            findCinema.CinemaName = request.CinemaName ?? findCinema.CinemaName;
            findCinema.CinemaDescription = request.CinemaDescription ?? findCinema.CinemaDescription;
            findCinema.CinemaHotLineNumber = request.CinemaHotlineNumber ?? findCinema.CinemaHotLineNumber;
            findCinema.CinemaLocation = request.CinemaLocation ?? findCinema.CinemaLocation;
            findCinema.CinemaCity = request.CinemaCity ?? findCinema.CinemaCity;

            if (request.Latitude.HasValue) findCinema.Latitude = request.Latitude.Value;
            if (request.Longitude.HasValue) findCinema.Longitude = request.Longitude.Value;

            findCinema.ActiveAt = DateTimeHelper.NormalizeIncoming(request.ActiveAt) ?? findCinema.ActiveAt;
            findCinema.UpdatedAt = DateTime.UtcNow;
            findCinema.IsActive = findCinema.ActiveAt < DateTime.UtcNow;
            findCinema.UpdatedByUserId = userId;

            await _auditLogService.WriteAsync(
                "Update",
                "Cinema",
                findCinema.CinemaId,
                findCinema.CinemaName,
                $"Updated cinema {findCinema.CinemaName}.",
                findCinema.CinemaId);

            await _repository.SaveChangesAsync();

            return new BaseResponse<string>
            {
                IsSuccess = true,
                Data = null,
                Message = Messages.Cinema.UpdateCompleted
            };
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
        try
        {
            var userId = GetUserId();
            var isAdmin = _userContext.IsInRole("Admin");
            var findCinema = await _repository.GetCinemaEntityByIdAsync(itemId, userId, isAdmin);

            if (findCinema == null)
            {
                throw new AppException(Messages.Cinema.NotFoundById(itemId),
                    StatusCodes.Status404NotFound, "C01");
            }

            findCinema.IsDeleted = true;
            findCinema.DeletedAt = DateTime.UtcNow;
            findCinema.DeletedByUserId = userId;

            var auditoriums = await _repository.GetActiveAuditoriumsByCinemaIdAsync(itemId);
            foreach (var aud in auditoriums)
            {
                aud.IsDeleted = true;
                aud.DeletedAt = DateTime.UtcNow;
                aud.DeletedByUserId = userId;

                var schedules = await _repository.GetActiveSchedulesByAuditoriumIdAsync(aud.AuditoriumId);
                foreach (var schedule in schedules)
                {
                    await _repository.CancelPendingOrdersForScheduleAsync(schedule.MovieScheduleInfoId);

                    schedule.IsDeleted = true;
                    schedule.DeletedAt = DateTime.UtcNow;
                    schedule.DeletedByUserId = userId;
                }
            }

            await _auditLogService.WriteAsync(
                "Delete",
                "Cinema",
                itemId,
                findCinema.CinemaName,
                $"Soft deleted cinema {findCinema.CinemaName} with {auditoriums.Count} auditoriums.",
                itemId);

            await _repository.SaveChangesAsync();

            return new BaseResponse<string>
            {
                IsSuccess = true,
                Data = null,
                Message = Messages.Cinema.DeleteCompleted
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

    private Guid GetUserId()
    {
        return _userContext.GetUserId();
    }
}
