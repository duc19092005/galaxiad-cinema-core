using Cinema.Application.Dtos;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.UseCases.TheaterManager.ShiftManagement;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager;

public class ApproveShiftRegistrationUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IShiftManagerRepository _repository;
    private readonly ISseNotificationService _sseNotificationService;
    private readonly ShiftRegistrationResolver _resolver;

    public ApproveShiftRegistrationUseCase(
        IShiftManagerRepository repository,
        ISseNotificationService sseNotificationService,
        ShiftRegistrationResolver resolver,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
        _sseNotificationService = sseNotificationService;
        _resolver = resolver;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid registrationId, Guid managerUserId, string? notes)
    {
        var registration = await _repository.GetRegistrationByIdWithTemplateAsync(registrationId);

        if (registration == null)
            throw new AppException(Messages.Staff.ShiftRegistrationNotFound, 404, "SHIFT_ERR");

        if (registration.Status != "Pending")
            throw new AppException(Messages.Staff.InvalidShiftRegistrationStatus, 400, "SHIFT_ERR");

        var (cinemaId, shiftName, maxStaff) = await _resolver.ResolveCinemaAndShiftAsync(registration);
        await _resolver.VerifyManagerPermissionAsync(managerUserId, cinemaId);

        int approvedCount;
        if (registration.ShiftScheduleId.HasValue)
            approvedCount = await _repository.CountApprovedRegistrationsForScheduleAsync(registration.ShiftScheduleId.Value);
        else
            approvedCount = await _repository.CountApprovedRegistrationsAsync(registration.ShiftTemplateId!.Value, registration.RegistrationDate);

        if (approvedCount >= maxStaff)
            throw new AppException(Messages.Staff.ShiftAlreadyFull, 400, "SHIFT_ERR");

        registration.Status = "Approved";
        registration.ApprovedByUserId = managerUserId;
        registration.ApprovedAt = DateTime.UtcNow;
        registration.Notes = notes;

        await _unitOfWork.SaveChangesAsync();

        await _sseNotificationService.SendNotificationAsync(
            registration.StaffId,
            "Shift Approved",
            $"Your shift '{shiftName}' on {registration.RegistrationDate:dd/MM/yyyy} has been approved.",
            "ShiftApproved"
        );

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = Messages.Staff.ApprovedShiftSuccessfully
        };
    }
}
