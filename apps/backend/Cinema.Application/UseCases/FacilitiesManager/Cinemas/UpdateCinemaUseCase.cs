using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Localization;
using Cinema.Domain.Utils;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.FacilitiesManager.Cinemas.Requests;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;

namespace Cinema.Application.UseCases.FacilitiesManager.Cinemas;

public class UpdateCinemaUseCase
{
    private readonly ICinemaRepository _repository;
    private readonly ILogger<UpdateCinemaUseCase> _logger;
    private readonly IUserContextService _userContext;
    private readonly IAuditLogService _auditLogService;

    public UpdateCinemaUseCase(
        ICinemaRepository repository,
        ILogger<UpdateCinemaUseCase> logger,
        IUserContextService userContext,
        IAuditLogService auditLogService)
    {
        _repository = repository;
        _logger = logger;
        _userContext = userContext;
        _auditLogService = auditLogService;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(Guid itemId, EditCinemaReqDto request)
    {
        try
        {
            var userId = _userContext.GetUserId();
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
}
