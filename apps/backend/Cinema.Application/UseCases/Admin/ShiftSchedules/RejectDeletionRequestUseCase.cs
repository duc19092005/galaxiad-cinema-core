using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Admin.ShiftSchedules;

/// <summary>
/// Rejects a shift deletion request, keeping the shift active.
/// </summary>
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
        var isAdmin = _userContextService.IsInRole("Admin");
        if (!isAdmin)
        {
            return new BaseResponse<bool> { IsSuccess = false, Message = "Bạn không có quyền thực hiện chức năng này." };
        }

        var schedule = await _repository.GetShiftScheduleByIdAsync(shiftScheduleId);
        if (schedule == null)
        {
            return new BaseResponse<bool> { IsSuccess = false, Message = "Không tìm thấy yêu cầu hủy ca." };
        }

        schedule.DeletionStatus = "Active";
        schedule.DeletionReason = null;
        var requesterId = schedule.DeletionRequestedByUserId;
        schedule.DeletionRequestedByUserId = null;
        schedule.DeletionRequestedAt = null;

        if (requesterId.HasValue)
        {
            var title = "Yêu cầu hủy ca bị từ chối";
            var message = $"Yêu cầu hủy ca '{schedule.ShiftName}' ngày {schedule.Date:dd/MM/yyyy} tại rạp của bạn đã bị từ chối bởi Admin.";
            var type = "DeletionRequestRejected";

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
            Message = "Đã từ chối yêu cầu hủy ca làm việc và gửi thông báo tới quản lý."
        };
    }
}
