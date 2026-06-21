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
using Cinema.Domain.Entities.CinemaInfos;
using Microsoft.AspNetCore.Http;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.FacilitiesManager.Cinemas;

public class CreateCinemaUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICinemaRepository _repository;
    private readonly ILogger<CreateCinemaUseCase> _logger;
    private readonly IUserContextService _userContext;
    private readonly IAuditLogService _auditLogService;

    public CreateCinemaUseCase(
        ICinemaRepository repository,
        ILogger<CreateCinemaUseCase> _logger,
        IUserContextService userContext,
        IAuditLogService auditLogService,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        this._logger = _logger;
        _userContext = userContext;
        _auditLogService = auditLogService;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(AddCinemaReqDto request)
    {
        Guid userId = _userContext.GetUserId();
        
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
            await _unitOfWork.SaveChangesAsync();

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
}
