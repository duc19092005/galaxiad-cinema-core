using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Domain.Exceptions;
using Cinema.Domain.Enums;
using Cinema.Domain.Localization;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.FacilitiesManager.Auditoriums.Requests;
using Cinema.Application.Interfaces.IBehaviors;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Application.Interfaces.Facilities;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.FacilitiesManager.Auditoriums;

public class FacilitiesManagerWriteAuditoriumUseCase : IWriteBehavior<AddReqAuditoriumDto, EditReqAuditoriumDto , string>
{
    private readonly IAuditoriumRepository _repository;
    private readonly ILogger<FacilitiesManagerWriteAuditoriumUseCase> _logger;
    private readonly IUserContextService _userContextService;
    private readonly IAuditLogService _auditLogService;

    public FacilitiesManagerWriteAuditoriumUseCase(
        IAuditoriumRepository repository,
        ILogger<FacilitiesManagerWriteAuditoriumUseCase> logger,
        IUserContextService userContextService,
        IAuditLogService auditLogService)
    {
        _repository = repository;
        _logger = logger;
        _userContextService = userContextService;
        _auditLogService = auditLogService;
    }

    public async Task<BaseResponse<string>> AddItem(AddReqAuditoriumDto request)
    {
        try
        {
            Guid userId = _userContextService.GetUserId();
            if (await _repository.IsDuplicateAuditoriumNumberAsync(null, request.AuditoriumNumber, request.CinemaId))
            {
                throw new AppException(Messages.Auditorium.AlreadyExists, 400, "D01");
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
            
            await _repository.SaveChangesAsync();

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

    public async Task<BaseResponse<string>> UpdateItem(Guid itemId, EditReqAuditoriumDto request)
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
                await _repository.SaveChangesAsync();
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
            await _repository.SaveChangesAsync();

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

    public async Task<BaseResponse<string>> DeleteItem(Guid itemId)
    {
        try
        {
            var userId = _userContextService.GetUserId();

            var findAuditorium = await _repository.GetAuditoriumEntityByIdAsync(itemId);
            if (findAuditorium == null || findAuditorium.IsDeleted)
            {
                throw new NotFoundException(Messages.Auditorium.NotFound);
            }

            var hasBookedBookings = await _repository.HasBookedBookingForAuditoriumAsync(itemId);
            if (hasBookedBookings)
            {
                throw new AppException(
                    Messages.Auditorium.CannotEditActiveBookings,
                    409,
                    "D02");
            }

            findAuditorium.IsDeleted = true;
            findAuditorium.DeletedAt = DateTime.UtcNow;
            findAuditorium.DeletedByUserId = userId;

            var schedules = await _repository.GetActiveSchedulesByAuditoriumIdAsync(itemId);
            foreach (var schedule in schedules)
            {
                await _repository.CancelPendingOrdersForScheduleAsync(schedule.MovieScheduleInfoId);

                schedule.IsDeleted = true;
                schedule.DeletedAt = DateTime.UtcNow;
                schedule.DeletedByUserId = userId;
            }

            await _auditLogService.WriteAsync(
                "Delete",
                "Auditorium",
                itemId,
                findAuditorium.AuditoriumNumber,
                $"Soft deleted auditorium {findAuditorium.AuditoriumNumber} with {schedules.Count} schedules.",
                findAuditorium.CinemaId);

            await _repository.SaveChangesAsync();

            return new BaseResponse<string>
            {
                IsSuccess = true,
                Message = Messages.Auditorium.DeleteCompleted,
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
