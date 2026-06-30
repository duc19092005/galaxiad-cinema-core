using Cinema.Application.Dtos;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.UseCases.TheaterManager.ShiftManagement;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager;

public class AssignShiftDirectlyUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IShiftManagerRepository _repository;
    private readonly IRedisLockService _redisLockService;
    private readonly ISseNotificationService _sseNotificationService;
    private readonly ShiftRegistrationResolver _resolver;

    public AssignShiftDirectlyUseCase(
        IShiftManagerRepository repository,
        IRedisLockService redisLockService,
        ISseNotificationService sseNotificationService,
        ShiftRegistrationResolver resolver,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _redisLockService = redisLockService;
        _sseNotificationService = sseNotificationService;
        _resolver = resolver;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid staffId, Guid shiftTemplateId, DateTime date, Guid managerUserId)
    {
        var staffProfile = await _repository.GetStaffProfileWithUserAsync(staffId);
        if (staffProfile == null || staffProfile.CinemaId == Guid.Empty)
            throw new AppException(Messages.Staff.StaffNotFound, 400, "SHIFT_ERR");

        var template = await _repository.GetShiftTemplateByIdAsync(shiftTemplateId);
        if (template == null)
            throw new AppException(Messages.Staff.ShiftTemplateNotFound, 400, "SHIFT_ERR");

        if (template.CinemaId != staffProfile.CinemaId)
            throw new AppException(Messages.Staff.CannotAssignToDifferentCinema, 400, "SHIFT_ERR");

        await _resolver.VerifyManagerPermissionAsync(managerUserId, template.CinemaId);

        var registrationDateOnly = date.Date;
        var lockKey = $"lock:shift:{shiftTemplateId}:{registrationDateOnly:yyyyMMdd}";
        var lockValue = Guid.NewGuid().ToString("N");

        var isLocked = await _redisLockService.AcquireLockAsync(lockKey, lockValue, TimeSpan.FromSeconds(5));
        if (!isLocked)
            throw new AppException(Messages.Staff.SystemBusyProcessingShift, 409, "SHIFT_ERR");

        try
        {
            var existingRegistrations = await _repository.GetActiveRegistrationsForStaffAndDateAsync(staffId, registrationDateOnly);

            var newStart = template.StartTime.TotalMinutes;
            var newEnd = template.EndTime <= template.StartTime ? template.EndTime.TotalMinutes + 1440 : template.EndTime.TotalMinutes;

            foreach (var reg in existingRegistrations)
            {
                var extTemplate = reg.CinemaShiftTemplateEntity;
                if (extTemplate == null || extTemplate.ShiftTemplateId == shiftTemplateId) continue;

                var extStart = extTemplate.StartTime.TotalMinutes;
                var extEnd = extTemplate.EndTime <= extTemplate.StartTime ? extTemplate.EndTime.TotalMinutes + 1440 : extTemplate.EndTime.TotalMinutes;

                if (newStart < extEnd && extStart < newEnd)
                    throw new AppException(Messages.Staff.OverlappingShiftExists, 400, "SHIFT_ERR");
            }

            var existing = existingRegistrations.FirstOrDefault(r => r.ShiftTemplateId == shiftTemplateId);

            if (existing != null)
            {
                if (existing.Status == "Approved")
                    throw new AppException(Messages.Staff.AlreadyRegisteredForShift, 400, "SHIFT_ERR");

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
                    return new BaseResponse<bool> { IsSuccess = true, Data = true, Message = Messages.Staff.ApprovedShiftSuccessfully };
                }
            }

            var registeredCount = await _repository.CountApprovedRegistrationsAsync(shiftTemplateId, registrationDateOnly);
            if (registeredCount >= template.MaxStaff)
                throw new AppException(Messages.Staff.ShiftAlreadyFull, 400, "SHIFT_ERR");

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
                Message = Messages.Staff.ApprovedShiftSuccessfully
            };
        }
        finally
        {
            await _redisLockService.ReleaseLockAsync(lockKey, lockValue);
        }
    }
}
