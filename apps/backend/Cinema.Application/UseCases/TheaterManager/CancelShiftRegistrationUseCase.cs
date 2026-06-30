using Cinema.Application.Dtos;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.UseCases.TheaterManager.ShiftManagement;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager;

public class CancelShiftRegistrationUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IShiftManagerRepository _repository;
    private readonly ISseNotificationService _sseNotificationService;
    private readonly ShiftRegistrationResolver _resolver;

    public CancelShiftRegistrationUseCase(
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

        if (registration.Status != "Approved")
            throw new AppException(Messages.Staff.InvalidShiftRegistrationStatus, 400, "SHIFT_ERR");

        var (cinemaId, shiftName, _) = await _resolver.ResolveCinemaAndShiftAsync(registration);
        await _resolver.VerifyManagerPermissionAsync(managerUserId, cinemaId);

        registration.Status = "Cancelled";
        registration.ApprovedByUserId = managerUserId;
        registration.ApprovedAt = DateTime.UtcNow;
        registration.Notes = string.IsNullOrEmpty(notes) ? "Manager cancelled shift" : notes;

        await _unitOfWork.SaveChangesAsync();

        await _sseNotificationService.SendNotificationAsync(
            registration.StaffId,
            "Shift Cancelled",
            $"Your approved shift '{shiftName}' on {registration.RegistrationDate:dd/MM/yyyy} has been cancelled by manager. Reason: {notes ?? "No reason provided"}.",
            "ShiftCancelled"
        );

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = Messages.Staff.CancelledShiftSuccessfully
        };
    }
}
