using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Interfaces.Persistence;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Staff;

public class CancelPendingRegistrationUseCase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStaffShiftRepository _repository;

    public CancelPendingRegistrationUseCase(IStaffShiftRepository repository,
        IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        _repository = repository;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid registrationId, Guid staffId)
    {
        var registration = await _repository.GetRegistrationByIdAndStaffAsync(registrationId, staffId);
        if (registration == null)
        {
            return new BaseResponse<bool> { IsSuccess = false, Message = Messages.Staff.ShiftRegistrationNotFound };
        }

        if (registration.Status != "Pending")
        {
            return new BaseResponse<bool> { IsSuccess = false, Message = Messages.Staff.CannotCancelNonPending };
        }

        await _repository.RemoveRegistrationAsync(registration);
        await _unitOfWork.SaveChangesAsync();

        return new BaseResponse<bool> { IsSuccess = true, Data = true, Message = Messages.Staff.CancelShiftSuccess };
    }
}
