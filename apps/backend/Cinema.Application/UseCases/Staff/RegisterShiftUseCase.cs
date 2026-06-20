using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.Interfaces.Staff;
using Cinema.Domain.Exceptions;

namespace Cinema.Application.UseCases.Staff;

public class RegisterShiftUseCase
{
    private readonly IStaffRepository _repository;
    private readonly IRedisLockService _redisLockService;

    public RegisterShiftUseCase(IStaffRepository repository, IRedisLockService redisLockService)
    {
        _repository = repository;
        _redisLockService = redisLockService;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid staffId, ReqRegisterShiftDto dto)
    {
        // 1. Kiểm tra xem nhân viên có StaffProfile hợp lệ không
        var staffProfile = await _repository.GetActiveStaffProfileAsync(staffId);

        if (staffProfile == null || staffProfile.CinemaId == Guid.Empty)
        {
            throw new AppException("Tài khoản của bạn không được gán vào chi nhánh rạp cụ thể hoặc đã ngừng hoạt động.", 400, "SHIFT_ERR");
        }

        if (dto.StartDate.Date > dto.EndDate.Date)
        {
            throw new AppException("Ngày bắt đầu không thể sau ngày kết thúc.", 400, "SHIFT_ERR");
        }

        // 2. Kiểm tra ca trực mẫu có tồn tại không
        if (dto.StartDate.Date < DateTime.UtcNow.Date || dto.EndDate.Date < DateTime.UtcNow.Date)
        {
            throw new AppException("Cannot register shifts in the past.", 400, "SHIFT_ERR");
        }

        var template = await _repository.GetShiftTemplateByIdAsync(dto.ShiftTemplateId);

        if (template == null)
        {
            throw new AppException("Ca trực mẫu không tồn tại hoặc đã bị ngừng hoạt động.", 400, "SHIFT_ERR");
        }

        // Nhân viên chỉ được đăng ký ca trực ở rạp mình trực thuộc
        if (template.CinemaId != staffProfile.CinemaId)
        {
            throw new AppException("Bạn chỉ được phép đăng ký ca trực tại rạp mình đang làm việc.", 400, "SHIFT_ERR");
        }

        var successDates = new List<string>();
        var failedDates = new List<string>();

        for (var date = dto.StartDate.Date; date <= dto.EndDate.Date; date = date.AddDays(1))
        {
            var registrationDateOnly = date;
            var lockKey = $"lock:shift:{dto.ShiftTemplateId}:{registrationDateOnly:yyyyMMdd}";
            var lockValue = Guid.NewGuid().ToString("N");

            // Acquire lock với TTL 5 giây
            var isLocked = await _redisLockService.AcquireLockAsync(lockKey, lockValue, TimeSpan.FromSeconds(5));
            if (!isLocked)
            {
                failedDates.Add($"{registrationDateOnly:dd/MM/yyyy} (Hệ thống bận)");
                continue;
            }

            try
            {
                // 3. Kiểm tra xem nhân viên đã đăng ký ca trực bị trùng khung giờ cho ngày này chưa (Pending hoặc Approved)
                var existingRegistrations = await _repository.GetActiveRegistrationsForStaffAndDateAsync(staffId, registrationDateOnly);

                bool isOverlapping = false;
                var newStart = template.StartTime.TotalMinutes;
                var newEnd = template.EndTime <= template.StartTime ? template.EndTime.TotalMinutes + 1440 : template.EndTime.TotalMinutes;

                foreach (var reg in existingRegistrations)
                {
                    var extTemplate = reg.CinemaShiftTemplateEntity;
                    if (extTemplate == null) continue;

                    var extStart = extTemplate.StartTime.TotalMinutes;
                    var extEnd = extTemplate.EndTime <= extTemplate.StartTime ? extTemplate.EndTime.TotalMinutes + 1440 : extTemplate.EndTime.TotalMinutes;

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

                // 4. Đếm số lượng ca đã được duyệt (Approved) hoặc đang chờ duyệt (Pending) trong ngày này
                var registeredCount = await _repository.CountApprovedOrPendingRegistrationsAsync(dto.ShiftTemplateId, registrationDateOnly);

                if (registeredCount >= template.MaxStaff)
                {
                    failedDates.Add($"{registrationDateOnly:dd/MM/yyyy} (Ca đã đầy)");
                    continue;
                }

                // 5. Tạo bản ghi đăng ký mới (Chờ duyệt)
                var newRegistration = new StaffShiftRegistrationEntity
                {
                    ShiftRegistrationId = Guid.NewGuid(),
                    StaffId = staffId,
                    ShiftTemplateId = dto.ShiftTemplateId,
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
                // Giải phóng lock an toàn
                await _redisLockService.ReleaseLockAsync(lockKey, lockValue);
            }
        }

        if (successDates.Count > 0)
        {
            await _repository.SaveChangesAsync();
        }

        var message = "";
        if (failedDates.Count == 0)
        {
            message = $"Đăng ký ca trực thành công cho {successDates.Count} ngày đã chọn, đang chờ Quản lý phê duyệt.";
        }
        else if (successDates.Count == 0)
        {
            throw new AppException($"Đăng ký ca trực thất bại cho tất cả các ngày đã chọn. Chi tiết: {string.Join(", ", failedDates)}", 400, "SHIFT_ERR");
        }
        else
        {
            message = $"Đăng ký thành công các ngày: {string.Join(", ", successDates)}. Thất bại các ngày: {string.Join(", ", failedDates)}.";
        }

        return new BaseResponse<bool>
        {
            IsSuccess = successDates.Count > 0,
            Data = successDates.Count > 0,
            Message = message
        };
    }
}
