using BusinessLayer.Dtos;
using BusinessLayer.Entities.CinemaInfos;
using BusinessLayer.Entities.UserInfos;
using BusinessLayer.Interfaces.IThirdPersonServices;
using Shared.Exceptions;
using Shared.Interfaces.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BusinessLayer.UseCases.TheaterManager;

public class ApproveShiftRegistrationUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRedisLockService _redisLockService;
    private readonly ISseNotificationService _sseNotificationService;

    public ApproveShiftRegistrationUseCase(
        IUnitOfWork unitOfWork, 
        IRedisLockService redisLockService,
        ISseNotificationService sseNotificationService)
    {
        _unitOfWork = unitOfWork;
        _redisLockService = redisLockService;
        _sseNotificationService = sseNotificationService;
    }

    // 1. Phê duyệt ca trực
    public async Task<BaseResponse<bool>> ApproveAsync(Guid registrationId, Guid managerUserId, string? notes)
    {
        var registration = await _unitOfWork.Repository<StaffShiftRegistrationEntity>().Query()
            .Include(r => r.CinemaShiftTemplateEntity)
            .Include(r => r.StaffProfileEntity)
            .FirstOrDefaultAsync(r => r.ShiftRegistrationId == registrationId);

        if (registration == null)
        {
            throw new AppException("Không tìm thấy yêu cầu đăng ký ca làm.", 404, "SHIFT_ERR");
        }

        if (registration.Status != "Pending")
        {
            throw new AppException($"Yêu cầu này đã được xử lý từ trước (Trạng thái hiện tại: {registration.Status}).", 400, "SHIFT_ERR");
        }

        // Kiểm tra quyền của người phê duyệt (Phải là Admin hoặc TheaterManager của cùng Rạp)
        await VerifyManagerPermissionAsync(managerUserId, registration.CinemaShiftTemplateEntity.CinemaId);

        // Đếm lại xem hiện tại số lượng ca Approved đã đạt tối đa chưa
        var approvedCount = await _unitOfWork.Repository<StaffShiftRegistrationEntity>().Query()
            .CountAsync(r => r.ShiftTemplateId == registration.ShiftTemplateId 
                             && r.RegistrationDate == registration.RegistrationDate 
                             && r.Status == "Approved");

        if (approvedCount >= registration.CinemaShiftTemplateEntity.MaxStaff)
        {
            throw new AppException("Ca làm việc này đã đủ số lượng nhân viên được phê duyệt.", 400, "SHIFT_ERR");
        }

        registration.Status = "Approved";
        registration.ApprovedByUserId = managerUserId;
        registration.ApprovedAt = DateTime.UtcNow;
        registration.Notes = notes;

        await _unitOfWork.SaveChangesAsync();

        await _sseNotificationService.SendNotificationAsync(
            registration.StaffId,
            "Duyệt ca trực",
            $"Ca trực '{registration.CinemaShiftTemplateEntity.ShiftName}' ngày {registration.RegistrationDate:dd/MM/yyyy} của bạn đã được phê duyệt.",
            "ShiftApproved"
        );

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = "Phê duyệt ca trực thành công."
        };
    }

    // 2. Từ chối ca trực
    public async Task<BaseResponse<bool>> RejectAsync(Guid registrationId, Guid managerUserId, string? notes)
    {
        var registration = await _unitOfWork.Repository<StaffShiftRegistrationEntity>().Query()
            .Include(r => r.CinemaShiftTemplateEntity)
            .FirstOrDefaultAsync(r => r.ShiftRegistrationId == registrationId);

        if (registration == null)
        {
            throw new AppException("Không tìm thấy yêu cầu đăng ký ca làm.", 404, "SHIFT_ERR");
        }

        if (registration.Status != "Pending")
        {
            throw new AppException($"Yêu cầu này đã được xử lý từ trước (Trạng thái hiện tại: {registration.Status}).", 400, "SHIFT_ERR");
        }

        // Kiểm tra quyền
        await VerifyManagerPermissionAsync(managerUserId, registration.CinemaShiftTemplateEntity.CinemaId);

        registration.Status = "Rejected";
        registration.ApprovedByUserId = managerUserId;
        registration.ApprovedAt = DateTime.UtcNow;
        registration.Notes = notes;

        await _unitOfWork.SaveChangesAsync();

        await _sseNotificationService.SendNotificationAsync(
            registration.StaffId,
            "Từ chối ca trực",
            $"Yêu cầu đăng ký ca trực '{registration.CinemaShiftTemplateEntity.ShiftName}' ngày {registration.RegistrationDate:dd/MM/yyyy} của bạn đã bị từ chối. Lý do: {notes ?? "Không có lý do cụ thể"}.",
            "ShiftRejected"
        );

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = "Từ chối yêu cầu đăng ký ca trực."
        };
    }

    // 3. Hủy ca trực đã phê duyệt (Giải quyết khi nhân viên xin nghỉ đột xuất)
    public async Task<BaseResponse<bool>> CancelApprovedAsync(Guid registrationId, Guid managerUserId, string? notes)
    {
        var registration = await _unitOfWork.Repository<StaffShiftRegistrationEntity>().Query()
            .Include(r => r.CinemaShiftTemplateEntity)
            .FirstOrDefaultAsync(r => r.ShiftRegistrationId == registrationId);

        if (registration == null)
        {
            throw new AppException("Không tìm thấy yêu cầu đăng ký ca làm.", 404, "SHIFT_ERR");
        }

        if (registration.Status != "Approved")
        {
            throw new AppException("Chỉ có thể hủy những ca trực đã được phê duyệt thành công.", 400, "SHIFT_ERR");
        }

        // Kiểm tra quyền
        await VerifyManagerPermissionAsync(managerUserId, registration.CinemaShiftTemplateEntity.CinemaId);

        registration.Status = "Cancelled";
        registration.ApprovedByUserId = managerUserId;
        registration.ApprovedAt = DateTime.UtcNow;
        registration.Notes = string.IsNullOrEmpty(notes) ? "Quản lý hủy ca làm" : notes;

        await _unitOfWork.SaveChangesAsync();

        await _sseNotificationService.SendNotificationAsync(
            registration.StaffId,
            "Hủy ca trực",
            $"Lịch làm việc ca trực '{registration.CinemaShiftTemplateEntity.ShiftName}' ngày {registration.RegistrationDate:dd/MM/yyyy} đã phê duyệt của bạn đã bị hủy bởi quản lý. Lý do: {notes ?? "Không có lý do cụ thể"}.",
            "ShiftCancelled"
        );

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = "Hủy ca làm việc đã phê duyệt thành công. Vị trí ca làm hiện đã trống cho người khác đăng ký."
        };
    }

    // 4. Gán trực tiếp nhân viên vào ca trực (Admin/Manager gán trực tiếp)
    public async Task<BaseResponse<bool>> AssignDirectlyAsync(Guid staffId, Guid shiftTemplateId, DateTime date, Guid managerUserId)
    {
        // Kiểm tra nhân viên mục tiêu có StaffProfile hợp lệ không
        var staffProfile = await _unitOfWork.Repository<StaffProfileEntity>().Query()
            .FirstOrDefaultAsync(s => s.UserId == staffId && s.WorkingStatus);

        if (staffProfile == null || staffProfile.CinemaId == Guid.Empty)
        {
            throw new AppException("Tài khoản nhân viên được gán không hợp lệ, chưa được gán rạp hoặc đã ngừng hoạt động.", 400, "SHIFT_ERR");
        }

        // Kiểm tra ca trực mẫu
        var template = await _unitOfWork.Repository<CinemaShiftTemplateEntity>().Query()
            .FirstOrDefaultAsync(t => t.ShiftTemplateId == shiftTemplateId && t.IsActive);

        if (template == null)
        {
            throw new AppException("Ca trực mẫu không tồn tại hoặc đã bị ngừng hoạt động.", 400, "SHIFT_ERR");
        }

        // Nhân viên chỉ được gán vào ca trực của rạp họ trực thuộc
        if (template.CinemaId != staffProfile.CinemaId)
        {
            throw new AppException("Không thể gán nhân viên vào ca trực ở chi nhánh rạp khác.", 400, "SHIFT_ERR");
        }

        // Kiểm tra quyền quản lý rạp của manager
        await VerifyManagerPermissionAsync(managerUserId, template.CinemaId);

        var registrationDateOnly = date.Date;
        var lockKey = $"lock:shift:{shiftTemplateId}:{registrationDateOnly:yyyyMMdd}";
        var lockValue = Guid.NewGuid().ToString("N");

        // Sử dụng lock Redis để đảm bảo an toàn số lượng nhân sự trực ca
        var isLocked = await _redisLockService.AcquireLockAsync(lockKey, lockValue, TimeSpan.FromSeconds(5));
        if (!isLocked)
        {
            throw new AppException("Hệ thống đang bận xử lý ca trực này, vui lòng thử lại sau.", 409, "SHIFT_ERR");
        }

        try
        {
            // Kiểm tra xem nhân viên đã có ca trực nào trùng khung giờ ngày này chưa (dù là Pending hay Approved)
            var existingRegistrations = await _unitOfWork.Repository<StaffShiftRegistrationEntity>().Query()
                .Include(r => r.CinemaShiftTemplateEntity)
                .Where(r => r.StaffId == staffId 
                         && r.RegistrationDate == registrationDateOnly 
                         && (r.Status == "Approved" || r.Status == "Pending"))
                .ToListAsync();

            bool isOverlapping = false;
            var newStart = template.StartTime.TotalMinutes;
            var newEnd = template.EndTime <= template.StartTime ? template.EndTime.TotalMinutes + 1440 : template.EndTime.TotalMinutes;

            foreach (var reg in existingRegistrations)
            {
                var extTemplate = reg.CinemaShiftTemplateEntity;
                if (extTemplate == null) continue;

                // Nếu là cùng mẫu ca trực này, chúng ta sẽ xử lý cập nhật trạng thái bên dưới
                if (extTemplate.ShiftTemplateId == shiftTemplateId) continue;

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
                throw new AppException("Nhân viên đã có lịch làm việc khác trùng khung giờ này.", 400, "SHIFT_ERR");
            }

            // Kiểm tra xem nhân viên đã có ca trực nào trùng ở template này ngày này chưa (dù là Pending hay Approved)
            var existing = existingRegistrations.FirstOrDefault(r => r.ShiftTemplateId == shiftTemplateId);

            if (existing != null)
            {
                if (existing.Status == "Approved")
                {
                    throw new AppException("Nhân viên này đã được gán vào ca trực từ trước.", 400, "SHIFT_ERR");
                }
                
                // Nếu đang ở Pending hoặc Cancelled/Rejected, chúng ta chỉ cần đè/update lại thành Approved
                if (existing.Status == "Pending" || existing.Status == "Rejected" || existing.Status == "Cancelled")
                {
                    existing.Status = "Approved";
                    existing.ApprovedByUserId = managerUserId;
                    existing.ApprovedAt = DateTime.UtcNow;
                    existing.Notes = "Quản lý gán trực tiếp";
                    
                    await _unitOfWork.SaveChangesAsync();
                    await _sseNotificationService.SendNotificationAsync(
                        staffId,
                        "Gán ca trực trực tiếp",
                        $"Bạn đã được quản lý gán trực tiếp vào ca làm '{template.ShiftName}' ngày {registrationDateOnly:dd/MM/yyyy}.",
                        "ShiftAssigned"
                    );
                    return new BaseResponse<bool> { IsSuccess = true, Data = true, Message = "Gán ca trực thành công." };
                }
            }

            // Đếm số ca Approved và Pending
            var registeredCount = await _unitOfWork.Repository<StaffShiftRegistrationEntity>().Query()
                .CountAsync(r => r.ShiftTemplateId == shiftTemplateId 
                                 && r.RegistrationDate == registrationDateOnly 
                                 && (r.Status == "Approved" || r.Status == "Pending"));

            if (registeredCount >= template.MaxStaff)
            {
                throw new AppException("Ca làm việc này đã đủ số lượng tối đa, không thể gán thêm.", 400, "SHIFT_ERR");
            }

            // Tạo ca trực đã duyệt luôn
            var directAssign = new StaffShiftRegistrationEntity
            {
                ShiftRegistrationId = Guid.NewGuid(),
                StaffId = staffId,
                ShiftTemplateId = shiftTemplateId,
                RegistrationDate = registrationDateOnly,
                Status = "Approved",
                ApprovedByUserId = managerUserId,
                ApprovedAt = DateTime.UtcNow,
                Notes = "Quản lý gán trực tiếp"
            };

            await _unitOfWork.Repository<StaffShiftRegistrationEntity>().AddAsync(directAssign);
            await _unitOfWork.SaveChangesAsync();

            await _sseNotificationService.SendNotificationAsync(
                staffId,
                "Gán ca trực trực tiếp",
                $"Bạn đã được quản lý gán trực tiếp vào ca làm '{template.ShiftName}' ngày {registrationDateOnly:dd/MM/yyyy}.",
                "ShiftAssigned"
            );

            return new BaseResponse<bool>
            {
                IsSuccess = true,
                Data = true,
                Message = "Gán trực tiếp nhân viên vào ca trực thành công."
            };
        }
        finally
        {
            await _redisLockService.ReleaseLockAsync(lockKey, lockValue);
        }
    }

    #region Private Helpers
    private async Task VerifyManagerPermissionAsync(Guid managerUserId, Guid cinemaId)
    {
        // 1. Kiểm tra xem manager có vai trò Admin không
        var isAdmin = await _unitOfWork.Repository<UserRoleInfoEntity>().Query()
            .AnyAsync(ur => ur.UserId == managerUserId && ur.RoleListInfoEntity.RoleName == "Admin");

        if (isAdmin) return; // Admin có toàn quyền trên mọi rạp

        // 2. Nếu không phải Admin, kiểm tra xem có phải TheaterManager của đúng Rạp này hay không
        var isTheaterManager = await _unitOfWork.Repository<UserRoleInfoEntity>().Query()
            .AnyAsync(ur => ur.UserId == managerUserId && ur.RoleListInfoEntity.RoleName == "TheaterManager");

        if (!isTheaterManager)
        {
            throw new AppException("Bạn không có quyền thực hiện thao tác quản lý này.", 403, "SHIFT_ERR");
        }

        // Kiểm tra xem StaffProfile của Manager có thuộc đúng Rạp này hay không
        var managerProfile = await _unitOfWork.Repository<StaffProfileEntity>().Query()
            .FirstOrDefaultAsync(s => s.UserId == managerUserId && s.WorkingStatus);

        if (managerProfile == null || managerProfile.CinemaId != cinemaId)
        {
            throw new AppException("Bạn chỉ có quyền quản lý nhân sự thuộc chi nhánh rạp của mình.", 403, "SHIFT_ERR");
        }
    }
    #endregion
}
