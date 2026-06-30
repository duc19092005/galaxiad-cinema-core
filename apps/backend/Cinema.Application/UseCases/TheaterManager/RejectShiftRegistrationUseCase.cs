using Cinema.Application.Dtos;
using Cinema.Application.Exceptions;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Application.UseCases.TheaterManager.ShiftManagement;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager;

public class RejectShiftRegistrationUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IShiftManagerRepository _repository;
    private readonly ISseNotificationService _sseNotificationService;
    private readonly ShiftRegistrationResolver _resolver;

    public RejectShiftRegistrationUseCase(
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

        var (cinemaId, shiftName, _) = await _resolver.ResolveCinemaAndShiftAsync(registration);
        await _resolver.VerifyManagerPermissionAsync(managerUserId, cinemaId);

        registration.Status = "Rejected";
        registration.ApprovedByUserId = managerUserId;
        registration.ApprovedAt = DateTime.UtcNow;
        registration.Notes = notes;

        await _unitOfWork.SaveChangesAsync();

        await _sseNotificationService.SendNotificationAsync(
            registration.StaffId,
            "Shift Rejected",
            $"Your shift registration request for '{shiftName}' on {registration.RegistrationDate:dd/MM/yyyy} has been rejected. Reason: {notes ?? "No reason provided"}.",
            "ShiftRejected"
        );

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = Messages.Staff.RejectedShiftSuccessfully
        };
    }
}
