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

    // 1. Approve shift registration
    public async Task<BaseResponse<bool>> ApproveAsync(Guid registrationId, Guid managerUserId, string? notes)
    {
        var registration = await _repository.GetRegistrationByIdWithTemplateAsync(registrationId);

        if (registration == null)
        {
            throw new AppException(Messages.Staff.ShiftRegistrationNotFound, 404, "SHIFT_ERR");
        }

        if (registration.Status != "Pending")
        {
            throw new AppException($"This request was already processed (Current status: {registration.Status}).", 400, "SHIFT_ERR");
        }

        // Verify manager permissions
        await VerifyManagerPermissionAsync(managerUserId, registration.CinemaShiftTemplateEntity.CinemaId);

        // Count approved registrations
        var approvedCount = await _repository.CountApprovedRegistrationsAsync(registration.ShiftTemplateId, registration.RegistrationDate);

        if (approvedCount >= registration.CinemaShiftTemplateEntity.MaxStaff)
        {
            throw new AppException(Messages.Staff.ShiftAlreadyFull, 400, "SHIFT_ERR");
        }

        registration.Status = "Approved";
        registration.ApprovedByUserId = managerUserId;
        registration.ApprovedAt = DateTime.UtcNow;
        registration.Notes = notes;

        await _unitOfWork.SaveChangesAsync();

        await _sseNotificationService.SendNotificationAsync(
            registration.StaffId,
            "Shift Approved",
            $"Your shift '{registration.CinemaShiftTemplateEntity.ShiftName}' on {registration.RegistrationDate:dd/MM/yyyy} has been approved.",
            "ShiftApproved"
        );

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = "Approved shift successfully."
        };
    }

    // 2. Reject shift registration
    public async Task<BaseResponse<bool>> RejectAsync(Guid registrationId, Guid managerUserId, string? notes)
    {
        var registration = await _repository.GetRegistrationByIdWithTemplateAsync(registrationId);

        if (registration == null)
        {
            throw new AppException(Messages.Staff.ShiftRegistrationNotFound, 404, "SHIFT_ERR");
        }

        if (registration.Status != "Pending")
        {
            throw new AppException($"This request was already processed (Current status: {registration.Status}).", 400, "SHIFT_ERR");
        }

        // Verify manager permissions
        await VerifyManagerPermissionAsync(managerUserId, registration.CinemaShiftTemplateEntity.CinemaId);

        registration.Status = "Rejected";
        registration.ApprovedByUserId = managerUserId;
        registration.ApprovedAt = DateTime.UtcNow;
        registration.Notes = notes;

        await _unitOfWork.SaveChangesAsync();

        await _sseNotificationService.SendNotificationAsync(
            registration.StaffId,
            "Shift Rejected",
            $"Your shift registration request for '{registration.CinemaShiftTemplateEntity.ShiftName}' on {registration.RegistrationDate:dd/MM/yyyy} has been rejected. Reason: {notes ?? "No reason provided"}.",
            "ShiftRejected"
        );

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = "Rejected shift registration request successfully."
        };
    }

    // 3. Cancel approved shift registration
    public async Task<BaseResponse<bool>> CancelApprovedAsync(Guid registrationId, Guid managerUserId, string? notes)
    {
        var registration = await _repository.GetRegistrationByIdWithTemplateAsync(registrationId);

        if (registration == null)
        {
            throw new AppException(Messages.Staff.ShiftRegistrationNotFound, 404, "SHIFT_ERR");
        }

        if (registration.Status != "Approved")
        {
            throw new AppException("Can only cancel shift registrations that are already approved.", 400, "SHIFT_ERR");
        }

        // Verify manager permissions
        await VerifyManagerPermissionAsync(managerUserId, registration.CinemaShiftTemplateEntity.CinemaId);

        registration.Status = "Cancelled";
        registration.ApprovedByUserId = managerUserId;
        registration.ApprovedAt = DateTime.UtcNow;
        registration.Notes = string.IsNullOrEmpty(notes) ? "Manager cancelled shift" : notes;

        await _unitOfWork.SaveChangesAsync();

        await _sseNotificationService.SendNotificationAsync(
            registration.StaffId,
            "Shift Cancelled",
            $"Your approved shift '{registration.CinemaShiftTemplateEntity.ShiftName}' on {registration.RegistrationDate:dd/MM/yyyy} has been cancelled by manager. Reason: {notes ?? "No reason provided"}.",
            "ShiftCancelled"
        );

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = "Cancelled approved shift successfully. Slot is now open for others."
        };
    }

    // 4. Assign staff directly to shift
    public async Task<BaseResponse<bool>> AssignDirectlyAsync(Guid staffId, Guid shiftTemplateId, DateTime date, Guid managerUserId)
    {
        // Verify staff profile
        var staffProfile = await _repository.GetStaffProfileWithUserAsync(staffId);

        if (staffProfile == null || staffProfile.CinemaId == Guid.Empty)
        {
            throw new AppException("The assigned staff account is invalid, not linked to a branch, or inactive.", 400, "SHIFT_ERR");
        }

        // Verify shift template
        var template = await _repository.GetShiftTemplateByIdAsync(shiftTemplateId);

        if (template == null)
        {
            throw new AppException(Messages.Staff.ShiftTemplateNotFound, 400, "SHIFT_ERR");
        }

        // Staff can only be assigned to shifts at their linked cinema
        if (template.CinemaId != staffProfile.CinemaId)
        {
            throw new AppException(Messages.Staff.CannotAssignToDifferentCinema, 400, "SHIFT_ERR");
        }

        // Verify manager permissions
        await VerifyManagerPermissionAsync(managerUserId, template.CinemaId);

        var registrationDateOnly = date.Date;
        var lockKey = $"lock:shift:{shiftTemplateId}:{registrationDateOnly:yyyyMMdd}";
        var lockValue = Guid.NewGuid().ToString("N");

        // Use Redis lock to secure max capacity constraint
        var isLocked = await _redisLockService.AcquireLockAsync(lockKey, lockValue, TimeSpan.FromSeconds(5));
        if (!isLocked)
        {
            throw new AppException(Messages.Staff.SystemBusyProcessingShift, 409, "SHIFT_ERR");
        }

        try
        {
            // Check for overlapping shifts on the same day
            var existingRegistrations = await _repository.GetActiveRegistrationsForStaffAndDateAsync(staffId, registrationDateOnly);

            bool isOverlapping = false;
            var newStart = template.StartTime.TotalMinutes;
            var newEnd = template.EndTime <= template.StartTime ? template.EndTime.TotalMinutes + 1440 : template.EndTime.TotalMinutes;

            foreach (var reg in existingRegistrations)
            {
                var extTemplate = reg.CinemaShiftTemplateEntity;
                if (extTemplate == null) continue;

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
                throw new AppException(Messages.Staff.OverlappingShiftExists, 400, "SHIFT_ERR");
            }

            var existing = existingRegistrations.FirstOrDefault(r => r.ShiftTemplateId == shiftTemplateId);

            if (existing != null)
            {
                if (existing.Status == "Approved")
                {
                    throw new AppException(Messages.Staff.AlreadyRegisteredForShift, 400, "SHIFT_ERR");
                }
                
                if (existing.Status == "Pending" || existing.Status == "Rejected" || existing.Status == "Cancelled")
                {
                    existing.Status = "Approved";
                    existing.ApprovedByUserId = managerUserId;
                    existing.ApprovedAt = DateTime.UtcNow;
                    existing.Notes = "Directly assigned by manager";
                    
                    await _unitOfWork.SaveChangesAsync();
                    await _sseNotificationService.SendNotificationAsync(
                        staffId,
                        "Direct Shift Assignment",
                        $"You have been directly assigned to the shift '{template.ShiftName}' on {registrationDateOnly:dd/MM/yyyy} by your manager.",
                        "ShiftAssigned"
                    );
                    return new BaseResponse<bool> { IsSuccess = true, Data = true, Message = "Assigned shift successfully." };
                }
            }

            // Count approved registrations
            var registeredCount = await _repository.CountApprovedRegistrationsAsync(shiftTemplateId, registrationDateOnly);

            if (registeredCount >= template.MaxStaff)
            {
                throw new AppException(Messages.Staff.ShiftAlreadyFull, 400, "SHIFT_ERR");
            }

            var directAssign = new StaffShiftRegistrationEntity
            {
                ShiftRegistrationId = Guid.NewGuid(),
                StaffId = staffId,
                ShiftTemplateId = shiftTemplateId,
                RegistrationDate = registrationDateOnly,
                Status = "Approved",
                ApprovedByUserId = managerUserId,
                ApprovedAt = DateTime.UtcNow,
                Notes = "Directly assigned by manager"
            };

            await _repository.AddShiftRegistrationAsync(directAssign);
            await _unitOfWork.SaveChangesAsync();

            await _sseNotificationService.SendNotificationAsync(
                staffId,
                "Direct Shift Assignment",
                $"You have been directly assigned to the shift '{template.ShiftName}' on {registrationDateOnly:dd/MM/yyyy} by your manager.",
                "ShiftAssigned"
            );

            return new BaseResponse<bool>
            {
                IsSuccess = true,
                Data = true,
                Message = "Assigned staff directly to shift successfully."
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
        var isAdmin = await _repository.UserHasRoleAsync(managerUserId, "Admin");

        if (isAdmin) return;

        var isTheaterManager = await _repository.UserHasRoleAsync(managerUserId, "TheaterManager");

        if (!isTheaterManager)
        {
            throw new AppException(Messages.Staff.NoPermissionShiftManage, 403, "SHIFT_ERR");
        }

        var managerProfile = await _repository.GetStaffProfileAsync(managerUserId);

        if (managerProfile == null || managerProfile.CinemaId != cinemaId)
        {
            throw new AppException(Messages.Staff.NoPermissionBranchStaffOnly, 403, "SHIFT_ERR");
        }
    }
    #endregion
}
