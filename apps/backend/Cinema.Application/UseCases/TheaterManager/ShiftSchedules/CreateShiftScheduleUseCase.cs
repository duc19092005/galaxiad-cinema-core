using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;
using Cinema.Domain.Utils;

namespace Cinema.Application.UseCases.TheaterManager.ShiftSchedules;

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
                return new BaseResponse<bool>
                {
                    IsSuccess = false,
                    Message = Messages.Staff.NoPermissionManageWorkSchedule
                };
            }
        }

        var weeksToCreate = 1;
        if (dto.RepeatWeekly && dto.RepeatWeeksCount.HasValue && dto.RepeatWeeksCount.Value > 0)
        {
            weeksToCreate = dto.RepeatWeeksCount.Value + 1;
        }

        var createdSchedules = new List<CinemaShiftScheduleEntity>();

        for (var week = 0; week < weeksToCreate; week++)
        {
            var targetDate = dto.Date.AddDays(week * 7);

            foreach (var shiftItem in dto.Shifts)
            {
                if (!IsValidTheaterHour(shiftItem.StartTime) || !IsValidTheaterHour(shiftItem.EndTime))
                {
                    throw new AppException(Messages.Staff.CinemaOperatingHours, 400, "SHIFT_ERR");
                }

                var rawStart = targetDate.Date + shiftItem.StartTime;
                var rawEnd = targetDate.Date + shiftItem.EndTime;
                if (shiftItem.EndTime <= shiftItem.StartTime)
                {
                    rawEnd = rawEnd.AddDays(1);
                }

                var localStart = DateTime.SpecifyKind(rawStart, DateTimeKind.Unspecified);
                var localEnd = DateTime.SpecifyKind(rawEnd, DateTimeKind.Unspecified);

                var utcStart = DateTimeHelper.NormalizeIncoming(localStart);
                var utcEnd = DateTimeHelper.NormalizeIncoming(localEnd);
                var duration = (utcEnd - utcStart).TotalHours;

                if (shiftItem.ShiftType == ShiftType.FullTime && Math.Abs(duration - 8.0) > 0.001)
                {
                    throw new AppException(Messages.Staff.FullTimeShiftMustBeEightHours, 400, "SHIFT_ERR");
                }

                if (shiftItem.ShiftType == ShiftType.PartTime && Math.Abs(duration - 4.0) > 0.001)
                {
                    throw new AppException(Messages.Staff.PartTimeShiftMustBeFourHours, 400, "SHIFT_ERR");
                }

                var schedule = new CinemaShiftScheduleEntity
                {
                    ShiftScheduleId = Guid.NewGuid(),
                    CinemaId = dto.CinemaId,
                    DepartmentId = dto.DepartmentId,
                    Date = utcStart.Date,
                    ShiftName = shiftItem.ShiftName,
                    StartTime = utcStart.TimeOfDay,
                    EndTime = utcEnd.TimeOfDay,
                    MaxStaff = shiftItem.MaxStaff,
                    RoleId = shiftItem.RoleId,
                    ShiftType = shiftItem.ShiftType,
                    IsActive = true,
                    DeletionStatus = "Active"
                };

                await _repository.AddShiftScheduleAsync(schedule);
                createdSchedules.Add(schedule);
            }
        }

        await _unitOfWork.SaveChangesAsync();

        var staffUserIds = await _repository.GetStaffUserIdsInDepartmentAsync(dto.CinemaId, dto.DepartmentId);
        var dateRange = weeksToCreate == 1
            ? $"on {dto.Date:dd/MM/yyyy}"
            : $"from {dto.Date:dd/MM/yyyy} to {dto.Date.AddDays((weeksToCreate - 1) * 7):dd/MM/yyyy}";

        foreach (var staffUserId in staffUserIds)
        {
            const string title = "New work schedule";
            var message = $"A manager created a new work schedule for your department {dateRange}. Please register for a shift.";
            const string type = "NewShiftSchedule";

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
            Message = Messages.Staff.ShiftSchedulesCreated(createdSchedules.Count)
        };
    }

    private static bool IsValidTheaterHour(TimeSpan time)
    {
        return time >= TimeSpan.FromHours(6) || time <= TimeSpan.FromHours(2);
    }
}
