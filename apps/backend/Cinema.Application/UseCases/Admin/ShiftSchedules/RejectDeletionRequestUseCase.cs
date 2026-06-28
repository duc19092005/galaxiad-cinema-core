using Cinema.Application.Dtos;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Admin.ShiftSchedules;

public class RejectDeletionRequestUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IShiftManagerRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly ISseNotificationService _sseNotificationService;

    public RejectDeletionRequestUseCase(
        IShiftManagerRepository repository,
        IUserContextService userContextService,
        ISseNotificationService sseNotificationService,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _userContextService = userContextService;
        _sseNotificationService = sseNotificationService;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid shiftScheduleId)
    {
        if (!_userContextService.IsInRole("Admin"))
        {
            return new BaseResponse<bool> { IsSuccess = false, Message = Messages.Staff.NoPermissionPerformAction };
        }

        var schedule = await _repository.GetShiftScheduleByIdAsync(shiftScheduleId);
        if (schedule == null)
        {
            return new BaseResponse<bool> { IsSuccess = false, Message = Messages.Staff.ShiftDeletionRequestNotFound };
        }

        schedule.DeletionStatus = "Active";
        schedule.DeletionReason = null;
        var requesterId = schedule.DeletionRequestedByUserId;
        schedule.DeletionRequestedByUserId = null;
        schedule.DeletionRequestedAt = null;

        if (requesterId.HasValue)
        {
            const string title = "Shift deletion request rejected";
            var message = $"Your deletion request for shift '{schedule.ShiftName}' on {schedule.Date:dd/MM/yyyy} was rejected by Admin.";
            const string type = "DeletionRequestRejected";

            var notification = new UserNotificationEntity
            {
                NotificationId = Guid.NewGuid(),
                UserId = requesterId.Value,
                Title = title,
                Message = message,
                Type = type,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<UserNotificationEntity>().AddAsync(notification);
            await _sseNotificationService.SendNotificationAsync(requesterId.Value, title, message, type);
        }

        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = Messages.Admin.ShiftDeletionRejected
        };
    }
}
