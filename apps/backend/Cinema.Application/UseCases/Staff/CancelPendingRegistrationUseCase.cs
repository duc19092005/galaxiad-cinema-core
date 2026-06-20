using System;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Interfaces.Facilities;

namespace Cinema.Application.UseCases.Staff;

public class CancelPendingRegistrationUseCase
{
    private readonly IStaffShiftRepository _repository;

    public CancelPendingRegistrationUseCase(IStaffShiftRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(Guid registrationId, Guid staffId)
    {
        var registration = await _repository.GetRegistrationByIdAndStaffAsync(registrationId, staffId);
        if (registration == null)
        {
            return new BaseResponse<bool> { IsSuccess = false, Message = "Không tìm thấy yêu cầu đăng ký ca làm của bạn." };
        }

        if (registration.Status != "Pending")
        {
            return new BaseResponse<bool> { IsSuccess = false, Message = "Chỉ có thể hủy ca làm khi đang ở trạng thái Chờ duyệt." };
        }

        await _repository.RemoveRegistrationAsync(registration);
        await _repository.SaveChangesAsync();

        return new BaseResponse<bool> { IsSuccess = true, Data = true, Message = "Hủy yêu cầu đăng ký ca làm thành công." };
    }
}
