using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.Interfaces.Staff;
using Cinema.Application.Exceptions;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Staff;

public class RegisterShiftUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStaffRepository _repository;
    private readonly IRedisLockService _redisLockService;

    public RegisterShiftUseCase(IStaffRepository repository, IRedisLockService redisLockService,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _redisLockService = redisLockService;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid staffId, ReqRegisterShiftDto dto)
    {
        var staffProfile = await _repository.GetActiveStaffProfileAsync(staffId);

        if (staffProfile == null || staffProfile.CinemaId == Guid.Empty)
        {
            throw new AppException(Messages.Staff.AccountNotLinkedToCinema, 400, "SHIFT_ERR");
        }

        // Check if we are registering for a schedule or a template
        if (dto.ShiftScheduleId.HasValue)
        {
            var schedule = await _repository.GetShiftScheduleByIdAsync(dto.ShiftScheduleId.Value);
            if (schedule == null || !schedule.IsActive || schedule.DeletionStatus != "Active")
            {
                throw new AppException("Lịch làm việc này không tồn tại hoặc đã bị hủy.", 400, "SHIFT_ERR");
            }

            if (schedule.CinemaId != staffProfile.CinemaId)
            {
                throw new AppException(Messages.Staff.CinemaMismatch, 400, "SHIFT_ERR");
            }

            if (schedule.DepartmentId != staffProfile.DepartmentId)
            {
                throw new AppException("Bạn chỉ được đăng ký ca làm việc thuộc phòng ban của mình.", 400, "SHIFT_ERR");
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
                throw new AppException("Hệ thống hiện tại đang bận, vui lòng đăng ký lại.", 400, "SHIFT_ERR");
            }

            try
            {
                // Check overlaps
                var existingRegistrations = await _repository.GetActiveRegistrationsForStaffAndDateAsync(staffId, schedule.Date);
                bool isOverlapping = false;
                var newStart = schedule.StartTime.TotalMinutes;
                var newEnd = schedule.EndTime <= schedule.StartTime ? schedule.EndTime.TotalMinutes + 1440 : schedule.EndTime.TotalMinutes;

                foreach (var reg in existingRegistrations)
                {
                    TimeSpan extStartSpan;
                    TimeSpan extEndSpan;

                    if (reg.CinemaShiftScheduleEntity != null)
                    {
                        extStartSpan = reg.CinemaShiftScheduleEntity.StartTime;
                        extEndSpan = reg.CinemaShiftScheduleEntity.EndTime;
                    }
                    else if (reg.CinemaShiftTemplateEntity != null)
                    {
                        extStartSpan = reg.CinemaShiftTemplateEntity.StartTime;
                        extEndSpan = reg.CinemaShiftTemplateEntity.EndTime;
                    }
                    else continue;

                    var extStart = extStartSpan.TotalMinutes;
                    var extEnd = extEndSpan <= extStartSpan ? extEndSpan.TotalMinutes + 1440 : extEndSpan.TotalMinutes;

                    if (newStart < extEnd && extStart < newEnd)
                    {
                        isOverlapping = true;
                        break;
                    }
                }

                if (isOverlapping)
                {
                    throw new AppException("Ca làm này trùng khung giờ với ca làm khác mà bạn đã đăng ký.", 400, "SHIFT_ERR");
                }

                // Check slot limits
                var registeredCount = await _repository.CountApprovedOrPendingRegistrationsForScheduleAsync(schedule.ShiftScheduleId);
                if (registeredCount >= schedule.MaxStaff)
                {
                    throw new AppException("Ca làm việc này đã đầy nhân viên.", 400, "SHIFT_ERR");
                }

                // Create registration
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
                    Message = "Đăng ký ca làm việc thành công, đang chờ quản lý duyệt."
                };
            }
            finally
            {
                await _redisLockService.ReleaseLockAsync(lockKey, lockValue);
            }
        }
        else if (dto.ShiftTemplateId.HasValue)
        {
            // Old template registration logic
            if (dto.StartDate.Date > dto.EndDate.Date)
            {
                throw new AppException(Messages.Staff.StartDateAfterEndDate, 400, "SHIFT_ERR");
            }

            if (dto.StartDate.Date < DateTime.UtcNow.Date || dto.EndDate.Date < DateTime.UtcNow.Date)
            {
                throw new AppException(Messages.Staff.CannotRegisterPastShifts, 400, "SHIFT_ERR");
            }

            var template = await _repository.GetShiftTemplateByIdAsync(dto.ShiftTemplateId.Value);

            if (template == null)
            {
                throw new AppException(Messages.Staff.ShiftTemplateNotFound, 400, "SHIFT_ERR");
            }

            if (template.CinemaId != staffProfile.CinemaId)
            {
                throw new AppException(Messages.Staff.CinemaMismatch, 400, "SHIFT_ERR");
            }

            var successDates = new List<string>();
            var failedDates = new List<string>();

            for (var date = dto.StartDate.Date; date <= dto.EndDate.Date; date = date.AddDays(1))
            {
                var registrationDateOnly = date;
                var lockKey = $"lock:shift:{dto.ShiftTemplateId}:{registrationDateOnly:yyyyMMdd}";
                var lockValue = Guid.NewGuid().ToString("N");

                var isLocked = await _redisLockService.AcquireLockAsync(lockKey, lockValue, TimeSpan.FromSeconds(5));
                if (!isLocked)
                {
                    failedDates.Add($"{registrationDateOnly:dd/MM/yyyy} (Hệ thống bận)");
                    continue;
                }

                try
                {
                    var existingRegistrations = await _repository.GetActiveRegistrationsForStaffAndDateAsync(staffId, registrationDateOnly);

                    bool isOverlapping = false;
                    var newStart = template.StartTime.TotalMinutes;
                    var newEnd = template.EndTime <= template.StartTime ? template.EndTime.TotalMinutes + 1440 : template.EndTime.TotalMinutes;

                    foreach (var reg in existingRegistrations)
                    {
                        TimeSpan extStartSpan;
                        TimeSpan extEndSpan;

                        if (reg.CinemaShiftScheduleEntity != null)
                        {
                            extStartSpan = reg.CinemaShiftScheduleEntity.StartTime;
                            extEndSpan = reg.CinemaShiftScheduleEntity.EndTime;
                        }
                        else if (reg.CinemaShiftTemplateEntity != null)
                        {
                            extStartSpan = reg.CinemaShiftTemplateEntity.StartTime;
                            extEndSpan = reg.CinemaShiftTemplateEntity.EndTime;
                        }
                        else continue;

                        var extStart = extStartSpan.TotalMinutes;
                        var extEnd = extEndSpan <= extStartSpan ? extEndSpan.TotalMinutes + 1440 : extEndSpan.TotalMinutes;

                        if (newStart < extEnd && extStart < newEnd)
                        {
                            isOverlapping = true;
                            break;
                        }
                    }

                    if (isOverlapping)
                    {
                        failedDates.Add($"{registrationDateOnly:dd/MM/yyyy} (Trùng khung giờ ca làm khác)");
                        continue;
                    }

                    var registeredCount = await _repository.CountApprovedOrPendingRegistrationsAsync(dto.ShiftTemplateId.Value, registrationDateOnly);

                    if (registeredCount >= template.MaxStaff)
                    {
                        failedDates.Add($"{registrationDateOnly:dd/MM/yyyy} (Ca đã đầy)");
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

            var message = "";
            if (failedDates.Count == 0)
            {
                message = string.Format(Messages.Staff.RegisterShiftSuccess, successDates.Count);
            }
            else if (successDates.Count == 0)
            {
                throw new AppException(string.Format(Messages.Staff.RegisterShiftAllFailed, string.Join(", ", failedDates)), 400, "SHIFT_ERR");
            }
            else
            {
                message = string.Format(Messages.Staff.RegisterShiftPartialSuccess, string.Join(", ", successDates), string.Join(", ", failedDates));
            }

            return new BaseResponse<bool>
            {
                IsSuccess = successDates.Count > 0,
                Data = successDates.Count > 0,
                Message = message
            };
        }
        else
        {
            throw new AppException("Vui lòng chọn ca làm hoặc lịch làm để đăng ký.", 400, "SHIFT_ERR");
        }
    }
}
