using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Domain.Exceptions;
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

public class UpdateAuditoriumUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditoriumRepository _repository;
    private readonly ILogger<UpdateAuditoriumUseCase> _logger;
    private readonly IUserContextService _userContextService;
    private readonly IAuditLogService _auditLogService;

    public UpdateAuditoriumUseCase(
        IAuditoriumRepository repository,
        ILogger<UpdateAuditoriumUseCase> logger,
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

    public async Task<BaseResponse<string>> ExecuteAsync(Guid itemId, EditReqAuditoriumDto request)
    {
        try
        {
            var getUserId = _userContextService.GetUserId();
            
            var hasBookedBookings = await _repository.HasBookedBookingForAuditoriumAsync(itemId);
            if (hasBookedBookings)
            {
                throw new AppException(
                    Messages.Auditorium.CannotEditActiveBookings,
                    409,
                    "D02");
            }

            if (request.AddReqSeatsAuditoriumDto != null && request.AddReqSeatsAuditoriumDto.Count > 0)
            {
                var hasAnyBookings = await _repository.HasAnyBookingForAuditoriumSeatsAsync(itemId);
                if (hasAnyBookings)
                {
                    throw new AppException(
                        Messages.Auditorium.CannotEditHasOrderHistory,
                        409,
                        "D03");
                }
            }

            if (request.AuditoriumNumber != null && request.CinemaId.HasValue &&
                await _repository.IsDuplicateAuditoriumNumberAsync(itemId, request.AuditoriumNumber, request.CinemaId.Value))
            {
                throw new AppException(Messages.Auditorium.DuplicateNumber, 400, "D01");
            }

            var findAuditorium = await _repository.GetAuditoriumEntityByIdAsync(itemId);
            if (findAuditorium == null)
            {
                throw new NotFoundException(Messages.Auditorium.NotFound);
            }
            
            if (request.FormatInfos != null && request.FormatInfos.Any())
            {
                var existingFormats = await _repository.GetFormatsByAuditoriumIdAsync(itemId);
                await _repository.DeleteAuditoriumFormatsAsync(existingFormats);

                var newLists = request.FormatInfos.Select(x => new AuditoriumFormatInfos
                {
                    AuditoriumId = itemId,
                    FormatId = x
                }).ToList();
                await _repository.AddAuditoriumFormatsAsync(newLists);
                await _unitOfWork.SaveChangesAsync();
            }
            
            findAuditorium.AuditoriumNumber = request.AuditoriumNumber ?? findAuditorium.AuditoriumNumber;
            findAuditorium.CinemaId = request.CinemaId ?? findAuditorium.CinemaId;
            findAuditorium.CreatedAt = DateTime.UtcNow;
            findAuditorium.UpdatedAt = DateTime.UtcNow;
            findAuditorium.UpdatedByUserId = getUserId;

            if (request.AddReqSeatsAuditoriumDto != null && request.AddReqSeatsAuditoriumDto.Count > 0)
            {
                var existingSeats = await _repository.GetSeatsByAuditoriumIdAsync(itemId);
                await _repository.DeleteSeatsAsync(existingSeats);

                var newSeatsInfos = request.AddReqSeatsAuditoriumDto.Select(item => new SeatsInfoEntity
                {
                    SeatId = Guid.NewGuid(),
                    SeatNumber = item.SeatNumber,
                    CoordX = item.CoordX,
                    CoordY = item.CoordY,
                    ColIndex = item.ColIndex,
                    RowIndex = item.RowIndex,
                    AuditoriumId = itemId
                }).ToList();

                await _repository.AddSeatsAsync(newSeatsInfos);
            }

            await _auditLogService.WriteAsync(
                "Update",
                "Auditorium",
                itemId,
                findAuditorium.AuditoriumNumber,
                $"Updated auditorium {findAuditorium.AuditoriumNumber}.",
                findAuditorium.CinemaId);
            await _unitOfWork.SaveChangesAsync();

            return new BaseResponse<string>
            {
                IsSuccess = true,
                Message = Messages.Auditorium.UpdateCompleted,
                Data = null
            };
        }
        catch (Exception e)
        {
            if (e is AppException)
            {
                throw;
            }
            throw CustomSystemException.SystemExceptionCaller();
        }
    }
}
