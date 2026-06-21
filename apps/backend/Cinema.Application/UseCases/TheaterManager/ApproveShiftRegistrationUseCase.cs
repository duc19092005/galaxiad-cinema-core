using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Exceptions;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager;

public class ApproveShiftRegistrationUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IShiftManagerRepository _repository;
    private readonly IRedisLockService _redisLockService;
    private readonly ISseNotificationService _sseNotificationService;

    public ApproveShiftRegistrationUseCase(
        IShiftManagerRepository repository, 
        IRedisLockService redisLockService,
        ISseNotificationService sseNotificationService,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _redisLockService = redisLockService;
        _sseNotificationService = sseNotificationService;
    }

    // 1. PhÃª duyá»‡t ca trá»±c
    public async Task<BaseResponse<bool>> ApproveAsync(Guid registrationId, Guid managerUserId, string? notes)
    {
        var registration = await _repository.GetRegistrationByIdWithTemplateAsync(registrationId);

        if (registration == null)
        {
            throw new AppException("KhÃ´ng tÃ¬m tháº¥y yÃªu cáº§u Ä‘Äƒng kÃ½ ca lÃ m.", 404, "SHIFT_ERR");
        }

        if (registration.Status != "Pending")
        {
            throw new AppException($"YÃªu cáº§u nÃ y Ä‘Ã£ Ä‘Æ°á»£c xá»­ lÃ½ tá»« trÆ°á»›c (Tráº¡ng thÃ¡i hiá»‡n táº¡i: {registration.Status}).", 400, "SHIFT_ERR");
        }

        // Kiá»ƒm tra quyá»n cá»§a ngÆ°á»i phÃª duyá»‡t (Pháº£i lÃ  Admin hoáº·c TheaterManager cá»§a cÃ¹ng Ráº¡p)
        await VerifyManagerPermissionAsync(managerUserId, registration.CinemaShiftTemplateEntity.CinemaId);

        // Äáº¿m láº¡i xem hiá»‡n táº¡i sá»‘ lÆ°á»£ng ca Approved Ä‘Ã£ Ä‘áº¡t tá»‘i Ä‘a chÆ°a
        var approvedCount = await _repository.CountApprovedRegistrationsAsync(registration.ShiftTemplateId, registration.RegistrationDate);

        if (approvedCount >= registration.CinemaShiftTemplateEntity.MaxStaff)
        {
            throw new AppException("Ca lÃ m viá»‡c nÃ y Ä‘Ã£ Ä‘á»§ sá»‘ lÆ°á»£ng nhÃ¢n viÃªn Ä‘Æ°á»£c phÃª duyá»‡t.", 400, "SHIFT_ERR");
        }

        registration.Status = "Approved";
        registration.ApprovedByUserId = managerUserId;
        registration.ApprovedAt = DateTime.UtcNow;
        registration.Notes = notes;

        await _unitOfWork.SaveChangesAsync();

        await _sseNotificationService.SendNotificationAsync(
            registration.StaffId,
            "Duyá»‡t ca trá»±c",
            $"Ca trá»±c '{registration.CinemaShiftTemplateEntity.ShiftName}' ngÃ y {registration.RegistrationDate:dd/MM/yyyy} cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c phÃª duyá»‡t.",
            "ShiftApproved"
        );

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = "PhÃª duyá»‡t ca trá»±c thÃ nh cÃ´ng."
        };
    }

    // 2. Tá»« chá»‘i ca trá»±c
    public async Task<BaseResponse<bool>> RejectAsync(Guid registrationId, Guid managerUserId, string? notes)
    {
        var registration = await _repository.GetRegistrationByIdWithTemplateAsync(registrationId);

        if (registration == null)
        {
            throw new AppException("KhÃ´ng tÃ¬m tháº¥y yÃªu cáº§u Ä‘Äƒng kÃ½ ca lÃ m.", 404, "SHIFT_ERR");
        }

        if (registration.Status != "Pending")
        {
            throw new AppException($"YÃªu cáº§u nÃ y Ä‘Ã£ Ä‘Æ°á»£c xá»­ lÃ½ tá»« trÆ°á»›c (Tráº¡ng thÃ¡i hiá»‡n táº¡i: {registration.Status}).", 400, "SHIFT_ERR");
        }

        // Kiá»ƒm tra quyá»n
        await VerifyManagerPermissionAsync(managerUserId, registration.CinemaShiftTemplateEntity.CinemaId);

        registration.Status = "Rejected";
        registration.ApprovedByUserId = managerUserId;
        registration.ApprovedAt = DateTime.UtcNow;
        registration.Notes = notes;

        await _unitOfWork.SaveChangesAsync();

        await _sseNotificationService.SendNotificationAsync(
            registration.StaffId,
            "Tá»« chá»‘i ca trá»±c",
            $"YÃªu cáº§u Ä‘Äƒng kÃ½ ca trá»±c '{registration.CinemaShiftTemplateEntity.ShiftName}' ngÃ y {registration.RegistrationDate:dd/MM/yyyy} cá»§a báº¡n Ä‘Ã£ bá»‹ tá»« chá»‘i. LÃ½ do: {notes ?? "KhÃ´ng cÃ³ lÃ½ do cá»¥ thá»ƒ"}.",
            "ShiftRejected"
        );

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = "Tá»« chá»‘i yÃªu cáº§u Ä‘Äƒng kÃ½ ca trá»±c."
        };
    }

    // 3. Há»§y ca trá»±c Ä‘Ã£ phÃª duyá»‡t (Giáº£i quyáº¿t khi nhÃ¢n viÃªn xin nghá»‰ Ä‘á»™t xuáº¥t)
    public async Task<BaseResponse<bool>> CancelApprovedAsync(Guid registrationId, Guid managerUserId, string? notes)
    {
        var registration = await _repository.GetRegistrationByIdWithTemplateAsync(registrationId);

        if (registration == null)
        {
            throw new AppException("KhÃ´ng tÃ¬m tháº¥y yÃªu cáº§u Ä‘Äƒng kÃ½ ca lÃ m.", 404, "SHIFT_ERR");
        }

        if (registration.Status != "Approved")
        {
            throw new AppException("Chá»‰ cÃ³ thá»ƒ há»§y nhá»¯ng ca trá»±c Ä‘Ã£ Ä‘Æ°á»£c phÃª duyá»‡t thÃ nh cÃ´ng.", 400, "SHIFT_ERR");
        }

        // Kiá»ƒm tra quyá»n
        await VerifyManagerPermissionAsync(managerUserId, registration.CinemaShiftTemplateEntity.CinemaId);

        registration.Status = "Cancelled";
        registration.ApprovedByUserId = managerUserId;
        registration.ApprovedAt = DateTime.UtcNow;
        registration.Notes = string.IsNullOrEmpty(notes) ? "Quáº£n lÃ½ há»§y ca lÃ m" : notes;

        await _unitOfWork.SaveChangesAsync();

        await _sseNotificationService.SendNotificationAsync(
            registration.StaffId,
            "Há»§y ca trá»±c",
            $"Lá»‹ch lÃ m viá»‡c ca trá»±c '{registration.CinemaShiftTemplateEntity.ShiftName}' ngÃ y {registration.RegistrationDate:dd/MM/yyyy} Ä‘Ã£ phÃª duyá»‡t cá»§a báº¡n Ä‘Ã£ bá»‹ há»§y bá»Ÿi quáº£n lÃ½. LÃ½ do: {notes ?? "KhÃ´ng cÃ³ lÃ½ do cá»¥ thá»ƒ"}.",
            "ShiftCancelled"
        );

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = "Há»§y ca lÃ m viá»‡c Ä‘Ã£ phÃª duyá»‡t thÃ nh cÃ´ng. Vá»‹ trÃ­ ca lÃ m hiá»‡n Ä‘Ã£ trá»‘ng cho ngÆ°á»i khÃ¡c Ä‘Äƒng kÃ½."
        };
    }

    // 4. GÃ¡n trá»±c tiáº¿p nhÃ¢n viÃªn vÃ o ca trá»±c (Admin/Manager gÃ¡n trá»±c tiáº¿p)
    public async Task<BaseResponse<bool>> AssignDirectlyAsync(Guid staffId, Guid shiftTemplateId, DateTime date, Guid managerUserId)
    {
        // Kiá»ƒm tra nhÃ¢n viÃªn má»¥c tiÃªu cÃ³ StaffProfile há»£p lá»‡ khÃ´ng
        var staffProfile = await _repository.GetStaffProfileWithUserAsync(staffId);

        if (staffProfile == null || staffProfile.CinemaId == Guid.Empty)
        {
            throw new AppException("TÃ i khoáº£n nhÃ¢n viÃªn Ä‘Æ°á»£c gÃ¡n khÃ´ng há»£p lá»‡, chÆ°a Ä‘Æ°á»£c gÃ¡n ráº¡p hoáº·c Ä‘Ã£ ngá»«ng hoáº¡t Ä‘á»™ng.", 400, "SHIFT_ERR");
        }

        // Kiá»ƒm tra ca trá»±c máº«u
        var template = await _repository.GetShiftTemplateByIdAsync(shiftTemplateId);

        if (template == null)
        {
            throw new AppException("Ca trá»±c máº«u khÃ´ng tá»“n táº¡i hoáº·c Ä‘Ã£ bá»‹ ngá»«ng hoáº¡t Ä‘á»™ng.", 400, "SHIFT_ERR");
        }

        // NhÃ¢n viÃªn chá»‰ Ä‘Æ°á»£c gÃ¡n vÃ o ca trá»±c cá»§a ráº¡p há» trá»±c thuá»™c
        if (template.CinemaId != staffProfile.CinemaId)
        {
            throw new AppException("KhÃ´ng thá»ƒ gÃ¡n nhÃ¢n viÃªn vÃ o ca trá»±c á»Ÿ chi nhÃ¡nh ráº¡p khÃ¡c.", 400, "SHIFT_ERR");
        }

        // Kiá»ƒm tra quyá»n quáº£n lÃ½ ráº¡p cá»§a manager
        await VerifyManagerPermissionAsync(managerUserId, template.CinemaId);

        var registrationDateOnly = date.Date;
        var lockKey = $"lock:shift:{shiftTemplateId}:{registrationDateOnly:yyyyMMdd}";
        var lockValue = Guid.NewGuid().ToString("N");

        // Sá»­ dá»¥ng lock Redis Ä‘á»ƒ Ä‘áº£m báº£o an toÃ n sá»‘ lÆ°á»£ng nhÃ¢n sá»± trá»±c ca
        var isLocked = await _redisLockService.AcquireLockAsync(lockKey, lockValue, TimeSpan.FromSeconds(5));
        if (!isLocked)
        {
            throw new AppException("Há»‡ thá»‘ng Ä‘ang báº­n xá»­ lÃ½ ca trá»±c nÃ y, vui lÃ²ng thá»­ láº¡i sau.", 409, "SHIFT_ERR");
        }

        try
        {
            // Kiá»ƒm tra xem nhÃ¢n viÃªn Ä‘Ã£ cÃ³ ca trá»±c nÃ o trÃ¹ng khung giá» ngÃ y nÃ y chÆ°a (dÃ¹ lÃ  Pending hay Approved)
            var existingRegistrations = await _repository.GetActiveRegistrationsForStaffAndDateAsync(staffId, registrationDateOnly);

            bool isOverlapping = false;
            var newStart = template.StartTime.TotalMinutes;
            var newEnd = template.EndTime <= template.StartTime ? template.EndTime.TotalMinutes + 1440 : template.EndTime.TotalMinutes;

            foreach (var reg in existingRegistrations)
            {
                var extTemplate = reg.CinemaShiftTemplateEntity;
                if (extTemplate == null) continue;

                // Náº¿u lÃ  cÃ¹ng máº«u ca trá»±c nÃ y, chÃºng ta sáº½ xá»­ lÃ½ cáº­p nháº­t tráº¡ng thÃ¡i bÃªn dÆ°á»›i
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
                throw new AppException("NhÃ¢n viÃªn Ä‘Ã£ cÃ³ lá»‹ch lÃ m viá»‡c khÃ¡c trÃ¹ng khung giá» nÃ y.", 400, "SHIFT_ERR");
            }

            // Kiá»ƒm tra xem nhÃ¢n viÃªn Ä‘Ã£ cÃ³ ca trá»±c nÃ o trÃ¹ng á»Ÿ template nÃ y ngÃ y nÃ y chÆ°a (dÃ¹ lÃ  Pending hay Approved)
            var existing = existingRegistrations.FirstOrDefault(r => r.ShiftTemplateId == shiftTemplateId);

            if (existing != null)
            {
                if (existing.Status == "Approved")
                {
                    throw new AppException("NhÃ¢n viÃªn nÃ y Ä‘Ã£ Ä‘Æ°á»£c gÃ¡n vÃ o ca trá»±c tá»« trÆ°á»›c.", 400, "SHIFT_ERR");
                }
                
                // Náº¿u Ä‘ang á»Ÿ Pending hoáº·c Cancelled/Rejected, chÃºng ta chá»‰ cáº§n Ä‘Ã¨/update láº¡i thÃ nh Approved
                if (existing.Status == "Pending" || existing.Status == "Rejected" || existing.Status == "Cancelled")
                {
                    existing.Status = "Approved";
                    existing.ApprovedByUserId = managerUserId;
                    existing.ApprovedAt = DateTime.UtcNow;
                    existing.Notes = "Quáº£n lÃ½ gÃ¡n trá»±c tiáº¿p";
                    
                    await _unitOfWork.SaveChangesAsync();
                    await _sseNotificationService.SendNotificationAsync(
                        staffId,
                        "GÃ¡n ca trá»±c trá»±c tiáº¿p",
                        $"Báº¡n Ä‘Ã£ Ä‘Æ°á»£c quáº£n lÃ½ gÃ¡n trá»±c tiáº¿p vÃ o ca lÃ m '{template.ShiftName}' ngÃ y {registrationDateOnly:dd/MM/yyyy}.",
                        "ShiftAssigned"
                    );
                    return new BaseResponse<bool> { IsSuccess = true, Data = true, Message = "GÃ¡n ca trá»±c thÃ nh cÃ´ng." };
                }
            }

            // Äáº¿m sá»‘ ca Approved vÃ  Pending
            var registeredCount = await _repository.CountApprovedRegistrationsAsync(shiftTemplateId, registrationDateOnly);

            if (registeredCount >= template.MaxStaff)
            {
                throw new AppException("Ca lÃ m viá»‡c nÃ y Ä‘Ã£ Ä‘á»§ sá»‘ lÆ°á»£ng tá»‘i Ä‘a, khÃ´ng thá»ƒ gÃ¡n thÃªm.", 400, "SHIFT_ERR");
            }

            // Táº¡o ca trá»±c Ä‘Ã£ duyá»‡t luÃ´n
            var directAssign = new StaffShiftRegistrationEntity
            {
                ShiftRegistrationId = Guid.NewGuid(),
                StaffId = staffId,
                ShiftTemplateId = shiftTemplateId,
                RegistrationDate = registrationDateOnly,
                Status = "Approved",
                ApprovedByUserId = managerUserId,
                ApprovedAt = DateTime.UtcNow,
                Notes = "Quáº£n lÃ½ gÃ¡n trá»±c tiáº¿p"
            };

            await _repository.AddShiftRegistrationAsync(directAssign);
            await _unitOfWork.SaveChangesAsync();

            await _sseNotificationService.SendNotificationAsync(
                staffId,
                "GÃ¡n ca trá»±c trá»±c tiáº¿p",
                $"Báº¡n Ä‘Ã£ Ä‘Æ°á»£c quáº£n lÃ½ gÃ¡n trá»±c tiáº¿p vÃ o ca lÃ m '{template.ShiftName}' ngÃ y {registrationDateOnly:dd/MM/yyyy}.",
                "ShiftAssigned"
            );

            return new BaseResponse<bool>
            {
                IsSuccess = true,
                Data = true,
                Message = "GÃ¡n trá»±c tiáº¿p nhÃ¢n viÃªn vÃ o ca trá»±c thÃ nh cÃ´ng."
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
        // 1. Kiá»ƒm tra xem manager cÃ³ vai trÃ² Admin khÃ´ng
        var isAdmin = await _repository.UserHasRoleAsync(managerUserId, "Admin");

        if (isAdmin) return; // Admin cÃ³ toÃ n quyá»n trÃªn má»i ráº¡p

        // 2. Náº¿u khÃ´ng pháº£i Admin, kiá»ƒm tra xem cÃ³ pháº£i TheaterManager cá»§a Ä‘Ãºng Ráº¡p nÃ y hay khÃ´ng
        var isTheaterManager = await _repository.UserHasRoleAsync(managerUserId, "TheaterManager");

        if (!isTheaterManager)
        {
            throw new AppException("Báº¡n khÃ´ng cÃ³ quyá»n thá»±c hiá»‡n thao tÃ¡c quáº£n lÃ½ nÃ y.", 403, "SHIFT_ERR");
        }

        // Kiá»ƒm tra xem StaffProfile cá»§a Manager cÃ³ thuá»™c Ä‘Ãºng Ráº¡p nÃ y hay khÃ´ng
        var managerProfile = await _repository.GetStaffProfileAsync(managerUserId);

        if (managerProfile == null || managerProfile.CinemaId != cinemaId)
        {
            throw new AppException("Báº¡n chá»‰ cÃ³ quyá»n quáº£n lÃ½ nhÃ¢n sá»± thuá»™c chi nhÃ¡nh ráº¡p cá»§a mÃ¬nh.", 403, "SHIFT_ERR");
        }
    }
    #endregion
}

