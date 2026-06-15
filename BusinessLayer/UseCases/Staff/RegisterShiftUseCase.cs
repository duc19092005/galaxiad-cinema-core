using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Shifts;
using BusinessLayer.Entities.CinemaInfos;
using BusinessLayer.Entities.UserInfos;
using BusinessLayer.Interfaces.IThirdPersonServices;
using Shared.Exceptions;
using Shared.Interfaces.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BusinessLayer.UseCases.Staff;

public class RegisterShiftUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRedisLockService _redisLockService;

    public RegisterShiftUseCase(IUnitOfWork unitOfWork, IRedisLockService redisLockService)
    {
        _unitOfWork = unitOfWork;
        _redisLockService = redisLockService;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid staffId, ReqRegisterShiftDto dto)
    {
        // 1. Kiểm tra xem nhân viên có StaffProfile hợp lệ không
        var staffProfile = await _unitOfWork.Repository<StaffProfileEntity>().Query()
            .FirstOrDefaultAsync(s => s.UserId == staffId && s.WorkingStatus);

        if (staffProfile == null)
        {
            throw new AppException("Tài khoản nhân viên không hợp lệ hoặc đã ngừng hoạt động.", 400, "SHIFT_ERR");
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

        var template = await _unitOfWork.Repository<CinemaShiftTemplateEntity>().Query()
            .FirstOrDefaultAsync(t => t.ShiftTemplateId == dto.ShiftTemplateId && t.IsActive);

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
                // 3. Kiểm tra xem nhân viên đã đăng ký ca trực này cho ngày này chưa
                var existingRegistration = await _unitOfWork.Repository<StaffShiftRegistrationEntity>().Query()
                    .FirstOrDefaultAsync(r => r.StaffId == staffId && r.ShiftTemplateId == dto.ShiftTemplateId && r.RegistrationDate == registrationDateOnly);

                if (existingRegistration != null)
                {
                    failedDates.Add($"{registrationDateOnly:dd/MM/yyyy} (Đã đăng ký trước)");
                    continue;
                }

                // 4. Đếm số lượng ca đã được duyệt (Approved) hoặc đang chờ duyệt (Pending) trong ngày này
                var registeredCount = await _unitOfWork.Repository<StaffShiftRegistrationEntity>().Query()
                    .CountAsync(r => r.ShiftTemplateId == dto.ShiftTemplateId 
                                     && r.RegistrationDate == registrationDateOnly 
                                     && (r.Status == "Approved" || r.Status == "Pending"));

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

                await _unitOfWork.Repository<StaffShiftRegistrationEntity>().AddAsync(newRegistration);
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
            await _unitOfWork.SaveChangesAsync();
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
