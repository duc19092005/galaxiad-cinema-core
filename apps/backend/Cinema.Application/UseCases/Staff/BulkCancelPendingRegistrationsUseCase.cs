using Cinema.Application.Dtos;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Staff;

/// <summary>
/// Bulk-cancels multiple pending shift registrations for the logged-in staff member.
/// </summary>
public class BulkCancelPendingRegistrationsUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStaffShiftRepository _repository;

    public BulkCancelPendingRegistrationsUseCase(IStaffShiftRepository repository,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(List<Guid> ids, Guid staffId)
    {
        if (ids == null || ids.Count == 0)
        {
            return new BaseResponse<bool> { IsSuccess = false, Message = Messages.Staff.RegistrationListInvalid };
        }

        var registrations = await _repository.GetPendingRegistrationsByIdsAsync(ids, staffId);
        if (registrations.Count == 0)
        {
            return new BaseResponse<bool> { IsSuccess = false, Message = Messages.Staff.NoRegistrationsFound };
        }

        var nonPending = registrations.Where(r => r.Status != "Pending").ToList();
        if (nonPending.Count > 0)
        {
            return new BaseResponse<bool> { IsSuccess = false, Message = Messages.Staff.CannotCancelNonPending };
        }

        await _repository.RemoveRegistrationsAsync(registrations);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = string.Format(Messages.Staff.CancelBulkShiftSuccess, registrations.Count)
        };
    }
}
