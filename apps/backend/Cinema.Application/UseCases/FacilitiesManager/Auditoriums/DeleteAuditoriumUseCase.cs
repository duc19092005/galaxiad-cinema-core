using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Exceptions;
using Cinema.Domain.Localization;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.FacilitiesManager.Auditoriums;

public class DeleteAuditoriumUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditoriumRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly IAuditLogService _auditLogService;

    public DeleteAuditoriumUseCase(
        IAuditoriumRepository repository,
        IUserContextService userContextService,
        IAuditLogService auditLogService,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _userContextService = userContextService;
        _auditLogService = auditLogService;
    }

    public async Task<BaseResponse<string>> ExecuteAsync(Guid itemId)
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

            await _unitOfWork.SaveChangesAsync();

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
