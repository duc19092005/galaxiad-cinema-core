using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Interfaces.Persistence;

namespace Cinema.Application.UseCases.TheaterManager.ShiftSchedules;

/// <summary>
/// Creates scheduled shifts for a specific department and date, repeating weekly if requested.
/// </summary>
public class CreateShiftScheduleUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IShiftManagerRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly ISseNotificationService _sseNotificationService;

    public CreateShiftScheduleUseCase(
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

    public async Task<BaseResponse<bool>> ExecuteAsync(ReqCreateShiftScheduleDto dto)
    {
        var managerUserId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        if (!isAdmin)
        {
            var isManager = await _repository.IsManagerOfCinemaAsync(dto.CinemaId, managerUserId);
            if (!isManager)
            {
                return new BaseResponse<bool> { IsSuccess = false, Message = "Bạn không có quyền quản lý lịch làm việc cho rạp này." };
            }
        }

        int weeksToCreate = 1;
        if (dto.RepeatWeekly && dto.RepeatWeeksCount.HasValue && dto.RepeatWeeksCount.Value > 0)
        {
            weeksToCreate = dto.RepeatWeeksCount.Value + 1;
        }

        var createdSchedules = new List<CinemaShiftScheduleEntity>();

        for (int week = 0; week < weeksToCreate; week++)
        {
            var targetDate = dto.Date.AddDays(week * 7);

            foreach (var shiftItem in dto.Shifts)
            {
                var schedule = new CinemaShiftScheduleEntity
                {
                    ShiftScheduleId = Guid.NewGuid(),
                    CinemaId = dto.CinemaId,
                    DepartmentId = dto.DepartmentId,
                    Date = targetDate.Date,
                    ShiftName = shiftItem.ShiftName,
                    StartTime = shiftItem.StartTime,
                    EndTime = shiftItem.EndTime,
                    MaxStaff = shiftItem.MaxStaff,
                    RoleId = shiftItem.RoleId,
                    IsActive = true,
                    DeletionStatus = "Active"
                };

                await _repository.AddShiftScheduleAsync(schedule);
                createdSchedules.Add(schedule);
            }
        }

        await _unitOfWork.SaveChangesAsync();

        // Get all active staff in the department to notify
        var staffUserIds = await _repository.GetStaffUserIdsInDepartmentAsync(dto.CinemaId, dto.DepartmentId);

        var dateRangeStr = weeksToCreate == 1 
            ? $"vào ngày {dto.Date:dd/MM/yyyy}" 
            : $"từ ngày {dto.Date:dd/MM/yyyy} đến ngày {dto.Date.AddDays((weeksToCreate - 1) * 7):dd/MM/yyyy}";

        foreach (var staffUserId in staffUserIds)
        {
            var title = "Lịch làm việc mới";
            var message = $"Quản lý rạp đã tạo lịch làm việc mới cho phòng ban của bạn {dateRangeStr}. Hãy đăng ký ca làm nhé!";
            var type = "NewShiftSchedule";

            var notification = new UserNotificationEntity
            {
                NotificationId = Guid.NewGuid(),
                UserId = staffUserId,
                Title = title,
                Message = message,
                Type = type,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.Repository<UserNotificationEntity>().AddAsync(notification);

            await _sseNotificationService.SendNotificationAsync(staffUserId, title, message, type);
        }

        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = $"Đã tạo lịch làm việc thành công ({createdSchedules.Count} ca làm)."
        };
    }
}
