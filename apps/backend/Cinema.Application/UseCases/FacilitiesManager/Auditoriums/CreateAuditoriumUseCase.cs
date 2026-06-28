using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Exceptions;
using Cinema.Domain.Enums;
using Cinema.Domain.Localization;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.FacilitiesManager.Auditoriums.Requests;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.FacilitiesManager.Auditoriums;

public class CreateAuditoriumUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditoriumRepository _repository;
    private readonly ILogger<CreateAuditoriumUseCase> _logger;
    private readonly IUserContextService _userContextService;
    private readonly IAuditLogService _auditLogService;

    public CreateAuditoriumUseCase(
        IAuditoriumRepository repository,
        ILogger<CreateAuditoriumUseCase> logger,
        IUserContextService userContextService,
        IAuditLogService auditLogService,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _logger = logger;
        _userContextService = userContextService;
        _auditLogService = auditLogService;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(AddReqAuditoriumDto request)
    {
        try
        {
            Guid userId = _userContextService.GetUserId();
            if (await _repository.IsDuplicateAuditoriumNumberAsync(null, request.AuditoriumNumber, request.CinemaId))
            {
                throw new AppException(Messages.Auditorium.AlreadyExists, 400, "D01");
            }

            var seatLayoutErrors = SeatLayoutPolicy.ValidateFullRectangularGrid(request.AddReqSeatsAuditoriumDto);
            if (seatLayoutErrors.Count > 0)
            {
                throw new BadRequestException(seatLayoutErrors, "D04");
            }

            Guid generateAuditoriumId = Guid.NewGuid();

            var newAuditoriumInfo = new AuditoriumInfoEntities
            {
                AuditoriumId = generateAuditoriumId,
                CinemaId = request.CinemaId,
                AuditoriumNumber = request.AuditoriumNumber,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = userId
            };

            var listsAuditoriumFormat = request.MovieFormatId.Select(x => new AuditoriumFormatInfos
            {
                FormatId = x,
                AuditoriumId = generateAuditoriumId
            }).ToList();

            await _repository.AddAuditoriumFormatsAsync(listsAuditoriumFormat);
            await _repository.AddAuditoriumAsync(newAuditoriumInfo);

            var seatsInfoEntities = request.AddReqSeatsAuditoriumDto.Select(items => new SeatsInfoEntity
            {
                SeatId = Guid.NewGuid(),
                SeatNumber = items.SeatNumber,
                CoordX = items.CoordX,
                CoordY = items.CoordY,
                ColIndex = items.ColIndex,
                RowIndex = items.RowIndex,
                AuditoriumId = generateAuditoriumId
            }).ToList();

            await _repository.AddSeatsAsync(seatsInfoEntities);
            await _auditLogService.WriteAsync(
                "Create",
                "Auditorium",
                generateAuditoriumId,
                request.AuditoriumNumber,
                $"Created auditorium {request.AuditoriumNumber}.",
                request.CinemaId);
            
            await _unitOfWork.SaveChangesAsync();

            return new BaseResponse<string>
            {
                IsSuccess = true,
                Message = Messages.Auditorium.AddCompleted
            };
        }
        catch (Exception e)
        {
            if (e is AppException)
            {
                throw;
            }
            _logger.LogError("Database Error : Error Detail {0}", e.Message);
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}
