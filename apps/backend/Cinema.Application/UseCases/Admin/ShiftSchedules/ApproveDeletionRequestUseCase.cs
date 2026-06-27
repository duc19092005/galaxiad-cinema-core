using System;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.Admin.ShiftSchedules;

/// <summary>
/// Approves a shift deletion request, cancels registrations, and notifies all registered staff.
/// </summary>
public class ApproveDeletionRequestUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IShiftManagerRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly ISseNotificationService _sseNotificationService;

    public ApproveDeletionRequestUseCase(
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

        schedule.DeletionStatus = "Deleted";
        schedule.IsActive = false;

        var registrations = schedule.StaffShiftRegistrationEntities
            .Where(r => r.Status == "Approved" || r.Status == "Pending")
            .ToList();

        foreach (var reg in registrations)
        {
            reg.Status = "Cancelled";
            reg.Notes = "Ca làm bị hủy bởi quản lý (được Admin duyệt)";

            var title = "Ca làm việc bị hủy";
            var message = $"Ca làm '{schedule.ShiftName}' ngày {schedule.Date:dd/MM/yyyy} mà bạn đã đăng ký đã bị quản lý hủy.";
            var type = "ShiftCancelled";

            var notification = new UserNotificationEntity
            {
                NotificationId = Guid.NewGuid(),
                UserId = reg.StaffId,
                Title = title,
                Message = message,
                Type = type,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.Repository<UserNotificationEntity>().AddAsync(notification);

            await _sseNotificationService.SendNotificationAsync(reg.StaffId, title, message, type);
        }

        if (schedule.DeletionRequestedByUserId.HasValue)
        {
            var title = "Yêu cầu hủy ca được duyệt";
            var message = $"Yêu cầu hủy ca '{schedule.ShiftName}' ngày {schedule.Date:dd/MM/yyyy} tại rạp của bạn đã được Admin phê duyệt.";
            var type = "DeletionRequestApproved";

            var notification = new UserNotificationEntity
            {
                NotificationId = Guid.NewGuid(),
                UserId = schedule.DeletionRequestedByUserId.Value,
                Title = title,
                Message = message,
                Type = type,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.Repository<UserNotificationEntity>().AddAsync(notification);

            await _sseNotificationService.SendNotificationAsync(schedule.DeletionRequestedByUserId.Value, title, message, type);
        }

        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = "Đã phê duyệt hủy ca làm việc và gửi thông báo tới các nhân viên liên quan."
        };
    }
}
