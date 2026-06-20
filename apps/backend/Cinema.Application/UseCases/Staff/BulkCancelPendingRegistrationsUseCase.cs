using Cinema.Application.Dtos;
using Cinema.Application.Interfaces.Facilities;

namespace Cinema.Application.UseCases.Staff;

/// <summary>
/// Bulk-cancels multiple pending shift registrations for the logged-in staff member.
/// </summary>
public class BulkCancelPendingRegistrationsUseCase
{
    private readonly IStaffShiftRepository _repository;

    public BulkCancelPendingRegistrationsUseCase(IStaffShiftRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<bool>> ExecuteAsync(List<Guid> ids, Guid staffId)
    {
        if (ids == null || ids.Count == 0)
        {
            return new BaseResponse<bool> { IsSuccess = false, Message = "Danh sách ID ca trực cần hủy không hợp lệ." };
        }

        var registrations = await _repository.GetPendingRegistrationsByIdsAsync(ids, staffId);
        if (registrations.Count == 0)
        {
            return new BaseResponse<bool> { IsSuccess = false, Message = "Không tìm thấy yêu cầu đăng ký ca làm nào trong danh sách." };
        }

        var nonPending = registrations.Where(r => r.Status != "Pending").ToList();
        if (nonPending.Count > 0)
        {
            return new BaseResponse<bool> { IsSuccess = false, Message = "Chỉ có thể hủy những ca làm đang ở trạng thái Chờ duyệt." };
        }

        await _repository.RemoveRegistrationsAsync(registrations);
        await _repository.SaveChangesAsync();

        return new BaseResponse<bool>
        {
            IsSuccess = true,
            Data = true,
            Message = $"Đã hủy thành công {registrations.Count} yêu cầu đăng ký ca làm."
        };
    }
}
