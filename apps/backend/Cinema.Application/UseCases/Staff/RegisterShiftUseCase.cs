using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.Interfaces.Staff;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;
using Cinema.Domain.Utils;

namespace Cinema.Application.UseCases.Staff;

public class RegisterShiftUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStaffRepository _repository;
    private readonly IRedisLockService _redisLockService;

    public RegisterShiftUseCase(
        IStaffRepository repository,
        IRedisLockService redisLockService,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _redisLockService = redisLockService;
    }

    private static void ValidateRegistrationEligibility(
        EmployeeWorkType employeeType,
        ShiftType shiftType,
        TimeSpan startTime,
        TimeSpan endTime,
        string? notes)
    {
        var duration = (endTime - startTime).TotalHours;
        if (duration <= 0)
        {
            duration += 24.0;
        }

        if (employeeType == EmployeeWorkType.PartTime)
        {
            if (shiftType == ShiftType.FullTime)
            {
                throw new AppException(Messages.Staff.PartTimeCanOnlyRegisterShortShifts, 400, "SHIFT_ERR");
            }

            if (shiftType == ShiftType.Rotating && duration > 4.0)
            {
                throw new AppException(Messages.Staff.PartTimeCannotRegisterLongShift, 400, "SHIFT_ERR");
            }
        }
        else if (employeeType == EmployeeWorkType.FullTime)
        {
            if ((shiftType == ShiftType.PartTime || (shiftType == ShiftType.Rotating && duration < 8.0)) &&
                string.IsNullOrWhiteSpace(notes))
            {
                throw new AppException(Messages.Staff.FullTimeShortShiftReasonRequired, 400, "SHIFT_ERR");
            }
        }
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid staffId, ReqRegisterShiftDto dto)
    {
        var staffProfile = await _repository.GetActiveStaffProfileAsync(staffId);
        if (staffProfile == null || staffProfile.CinemaId == Guid.Empty)
        {
            throw new AppException(Messages.Staff.AccountNotLinkedToCinema, 400, "SHIFT_ERR");
        }

        if (dto.ShiftScheduleId.HasValue && dto.ShiftScheduleId.Value != Guid.Empty)
        {
            return await RegisterForScheduleAsync(staffId, dto, staffProfile);
        }

        if (dto.ShiftTemplateId.HasValue && dto.ShiftTemplateId.Value != Guid.Empty)
        {
            return await RegisterForTemplateAsync(staffId, dto, staffProfile);
        }

        throw new AppException(Messages.Staff.SelectShiftToRegister, 400, "SHIFT_ERR");
    }

    private async Task<BaseResponse<bool>> RegisterForScheduleAsync(
        Guid staffId,
        ReqRegisterShiftDto dto,
        StaffProfileEntity staffProfile)
    {
        var schedule = await _repository.GetShiftScheduleByIdAsync(dto.ShiftScheduleId!.Value);
        if (schedule == null || !schedule.IsActive || schedule.DeletionStatus != "Active")
        {
            throw new AppException(Messages.Staff.WorkScheduleNotFound, 400, "SHIFT_ERR");
        }

        if (schedule.CinemaId != staffProfile.CinemaId)
        {
            throw new AppException(Messages.Staff.CinemaMismatch, 400, "SHIFT_ERR");
        }

        ValidateRegistrationEligibility(staffProfile.EmployeeType, schedule.ShiftType, schedule.StartTime, schedule.EndTime, dto.Notes);

        if (schedule.DepartmentId != staffProfile.DepartmentId)
        {
            throw new AppException(Messages.Staff.StaffCanOnlyRegisterOwnDepartment, 400, "SHIFT_ERR");
        }

        if (schedule.Date.Date < DateTime.UtcNow.Date)
        {
            throw new AppException(Messages.Staff.CannotRegisterPastShifts, 400, "SHIFT_ERR");
        }

        var lockKey = $"lock:shift-schedule:{schedule.ShiftScheduleId}";
        var lockValue = Guid.NewGuid().ToString("N");
        var isLocked = await _redisLockService.AcquireLockAsync(lockKey, lockValue, TimeSpan.FromSeconds(5));
        if (!isLocked)
        {
            throw new AppException(Messages.Staff.SystemBusyRegisterShift, 400, "SHIFT_ERR");
        }

        try
        {
            if (await HasOverlappingRegistrationAsync(staffId, schedule.Date, schedule.StartTime, schedule.EndTime))
            {
                throw new AppException(Messages.Staff.ShiftOverlapsExistingRegistration, 400, "SHIFT_ERR");
            }

            var registeredCount = await _repository.CountApprovedOrPendingRegistrationsForScheduleAsync(schedule.ShiftScheduleId);
            if (registeredCount >= schedule.MaxStaff)
            {
                throw new AppException(Messages.Staff.ShiftFull, 400, "SHIFT_ERR");
            }

            var newRegistration = new StaffShiftRegistrationEntity
            {
                ShiftRegistrationId = Guid.NewGuid(),
                StaffId = staffId,
                ShiftTemplateId = null,
                ShiftScheduleId = schedule.ShiftScheduleId,
                RegistrationDate = schedule.Date,
                Status = "Pending",
                ApprovedByUserId = null,
                ApprovedAt = null,
                Notes = dto.Notes
            };

            await _repository.AddShiftRegistrationAsync(newRegistration);
            await _unitOfWork.SaveChangesAsync();

            return new BaseResponse<bool>
            {
                IsSuccess = true,
                Data = true,
                Message = string.Format(Messages.Staff.RegisterShiftSuccess, 1)
            };
        }
        finally
        {
            await _redisLockService.ReleaseLockAsync(lockKey, lockValue);
        }
    }

    private async Task<BaseResponse<bool>> RegisterForTemplateAsync(
        Guid staffId,
        ReqRegisterShiftDto dto,
        StaffProfileEntity staffProfile)
    {
        var normalizedStartDate = DateTimeHelper.NormalizeIncoming(dto.StartDate).Date;
        var normalizedEndDate = DateTimeHelper.NormalizeIncoming(dto.EndDate).Date;

        if (normalizedStartDate > normalizedEndDate)
        {
            throw new AppException(Messages.Staff.StartDateAfterEndDate, 400, "SHIFT_ERR");
        }

        if (normalizedStartDate < DateTime.UtcNow.Date || normalizedEndDate < DateTime.UtcNow.Date)
        {
            throw new AppException(Messages.Staff.CannotRegisterPastShifts, 400, "SHIFT_ERR");
        }

        var template = await _repository.GetShiftTemplateByIdAsync(dto.ShiftTemplateId!.Value);
        if (template == null)
        {
            throw new AppException(Messages.Staff.ShiftTemplateNotFound, 400, "SHIFT_ERR");
        }

        if (template.CinemaId != staffProfile.CinemaId)
        {
            throw new AppException(Messages.Staff.CinemaMismatch, 400, "SHIFT_ERR");
        }

        ValidateRegistrationEligibility(staffProfile.EmployeeType, template.ShiftType, template.StartTime, template.EndTime, dto.Notes);

        var successDates = new List<string>();
        var failedDates = new List<string>();

        for (var date = normalizedStartDate; date <= normalizedEndDate; date = date.AddDays(1))
        {
            var registrationDateOnly = date;
            var lockKey = $"lock:shift:{dto.ShiftTemplateId}:{registrationDateOnly:yyyyMMdd}";
            var lockValue = Guid.NewGuid().ToString("N");

            var isLocked = await _redisLockService.AcquireLockAsync(lockKey, lockValue, TimeSpan.FromSeconds(5));
            if (!isLocked)
            {
                failedDates.Add($"{registrationDateOnly:dd/MM/yyyy} (system busy)");
                continue;
            }

            try
            {
                if (await HasOverlappingRegistrationAsync(staffId, registrationDateOnly, template.StartTime, template.EndTime))
                {
                    failedDates.Add($"{registrationDateOnly:dd/MM/yyyy} (overlapping shift)");
                    continue;
                }

                var registeredCount = await _repository.CountApprovedOrPendingRegistrationsAsync(dto.ShiftTemplateId.Value, registrationDateOnly);
                if (registeredCount >= template.MaxStaff)
                {
                    failedDates.Add($"{registrationDateOnly:dd/MM/yyyy} (shift full)");
                    continue;
                }

                var newRegistration = new StaffShiftRegistrationEntity
                {
                    ShiftRegistrationId = Guid.NewGuid(),
                    StaffId = staffId,
                    ShiftTemplateId = dto.ShiftTemplateId,
                    ShiftScheduleId = null,
                    RegistrationDate = registrationDateOnly,
                    Status = "Pending",
                    ApprovedByUserId = null,
                    ApprovedAt = null,
                    Notes = dto.Notes
                };

                await _repository.AddShiftRegistrationAsync(newRegistration);
                successDates.Add(registrationDateOnly.ToString("dd/MM/yyyy"));
            }
            finally
            {
                await _redisLockService.ReleaseLockAsync(lockKey, lockValue);
            }
        }

        if (successDates.Count > 0)
        {
            await _unitOfWork.SaveChangesAsync();
        }

        if (failedDates.Count == 0)
        {
            return new BaseResponse<bool>
            {
                IsSuccess = true,
                Data = true,
                Message = string.Format(Messages.Staff.RegisterShiftSuccess, successDates.Count)
            };
        }

        if (successDates.Count == 0)
        {
            throw new AppException(string.Format(Messages.Staff.RegisterShiftAllFailed, string.Join(", ", failedDates)), 400, "SHIFT_ERR");
        }

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = string.Format(Messages.Staff.RegisterShiftPartialSuccess, string.Join(", ", successDates), string.Join(", ", failedDates))
        };
    }

    private async Task<bool> HasOverlappingRegistrationAsync(Guid staffId, DateTime date, TimeSpan newStartSpan, TimeSpan newEndSpan)
    {
        var existingRegistrations = await _repository.GetActiveRegistrationsForStaffAndDateAsync(staffId, date);
        var newStart = newStartSpan.TotalMinutes;
        var newEnd = newEndSpan <= newStartSpan ? newEndSpan.TotalMinutes + 1440 : newEndSpan.TotalMinutes;

        foreach (var registration in existingRegistrations)
        {
            TimeSpan existingStartSpan;
            TimeSpan existingEndSpan;

            if (registration.CinemaShiftScheduleEntity != null)
            {
                existingStartSpan = registration.CinemaShiftScheduleEntity.StartTime;
                existingEndSpan = registration.CinemaShiftScheduleEntity.EndTime;
            }
            else if (registration.CinemaShiftTemplateEntity != null)
            {
                existingStartSpan = registration.CinemaShiftTemplateEntity.StartTime;
                existingEndSpan = registration.CinemaShiftTemplateEntity.EndTime;
            }
            else
            {
                continue;
            }

            var existingStart = existingStartSpan.TotalMinutes;
            var existingEnd = existingEndSpan <= existingStartSpan ? existingEndSpan.TotalMinutes + 1440 : existingEndSpan.TotalMinutes;

            if (newStart < existingEnd && existingStart < newEnd)
            {
                return true;
            }
        }

        return false;
    }
}
