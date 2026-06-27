using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.TheaterManager.ShiftSchedules;

/// <summary>
/// Deletes a scheduled shift. If staff have registered, requests admin approval.
/// </summary>
public class DeleteShiftScheduleUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IShiftManagerRepository _repository;
    private readonly IUserContextService _userContextService;

    public DeleteShiftScheduleUseCase(
        IShiftManagerRepository repository,
        IUserContextService userContextService,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid shiftScheduleId, ReqDeleteShiftScheduleDto dto)
    {
        var managerUserId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var schedule = await _repository.GetShiftScheduleByIdAsync(shiftScheduleId);
        if (schedule == null)
        {
            return new BaseResponse<bool> { IsSuccess = false, Message = "Không tìm thấy lịch làm việc." };
        }

        if (!isAdmin)
        {
            var isManager = await _repository.IsManagerOfCinemaAsync(schedule.CinemaId, managerUserId);
            if (!isManager)
            {
                return new BaseResponse<bool> { IsSuccess = false, Message = "Bạn không có quyền quản lý lịch làm việc cho rạp này." };
            }
        }

        var registeredCount = await _repository.CountApprovedOrPendingRegistrationsForScheduleAsync(shiftScheduleId);

        if (registeredCount > 0)
        {
            schedule.DeletionStatus = "PendingDeletion";
            schedule.DeletionReason = dto.Reason;
            schedule.DeletionRequestedByUserId = managerUserId;
            schedule.DeletionRequestedAt = DateTime.UtcNow;

            await _unitOfWork.SaveChangesAsync();

            return new BaseResponse<bool>
            {
                IsSuccess = true,
                Data = false,
                Message = "Ca làm này đã có nhân viên đăng ký. Yêu cầu hủy ca đã được gửi lên Admin phê duyệt."
            };
        }
        else
        {
            schedule.IsActive = false;
            await _unitOfWork.SaveChangesAsync();

            return new BaseResponse<bool>
            {
                IsSuccess = true,
                Data = true,
                Message = "Đã xóa ca làm việc thành công."
            };
        }
    }
}
