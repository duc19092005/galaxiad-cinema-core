using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Facilities;

namespace Cinema.Application.UseCases.Staff;

/// <summary>
/// Gets the available shift templates for a staff member's cinema on a given date.
/// </summary>
public class GetAvailableShiftsUseCase
{
    private readonly IStaffShiftRepository _repository;

    public GetAvailableShiftsUseCase(IStaffShiftRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<ResShiftTemplateDto>>> ExecuteAsync(Guid staffId, DateTime date)
    {
        var staffProfile = await _repository.GetStaffProfileByUserIdAsync(staffId);
        if (staffProfile == null || staffProfile.CinemaId == Guid.Empty)
        {
            return new BaseResponse<List<ResShiftTemplateDto>>
            {
                IsSuccess = false,
                Message = "Tài khoản của bạn không được gán vào chi nhánh rạp cụ thể."
            };
        }

        var registrationDateOnly = date.Date;
        var templates = await _repository.GetActiveShiftTemplatesForCinemaAsync(staffProfile.CinemaId);

        var resultList = new List<ResShiftTemplateDto>();
        foreach (var t in templates)
        {
            var count = await _repository.CountApprovedOrPendingRegistrationsAsync(t.ShiftTemplateId, registrationDateOnly);
            resultList.Add(new ResShiftTemplateDto
            {
                ShiftTemplateId = t.ShiftTemplateId,
                CinemaId = t.CinemaId,
                CinemaName = t.CinemaInfoEntity?.CinemaName ?? "",
                ShiftName = t.ShiftName,
                StartTime = t.StartTime,
                EndTime = t.EndTime,
                MaxStaff = t.MaxStaff,
                RegisteredCount = count,
                RoleId = t.RoleId,
                RoleName = t.RoleListInfoEntity?.RoleName ?? ""
            });
        }

        return new BaseResponse<List<ResShiftTemplateDto>> { IsSuccess = true, Data = resultList };
    }
}

/// <summary>
/// Gets the logged-in staff member's own shift registrations.
/// </summary>
public class GetMyRegistrationsUseCase
{
    private readonly IStaffShiftRepository _repository;

    public GetMyRegistrationsUseCase(IStaffShiftRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<ResStaffShiftRegistrationDto>>> ExecuteAsync(Guid staffId)
    {
        var list = await _repository.GetMyRegistrationsAsync(staffId);
        return new BaseResponse<List<ResStaffShiftRegistrationDto>> { IsSuccess = true, Data = list };
    }
}

/// <summary>
/// Cancels a single pending shift registration for the logged-in staff member.
/// </summary>
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

/// <summary>
/// Gets the working history for the logged-in staff member.
/// </summary>
public class GetMyWorkingHistoryUseCase
{
    private readonly IStaffShiftRepository _repository;

    public GetMyWorkingHistoryUseCase(IStaffShiftRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<StaffWorkingLoggerEntity>>> ExecuteAsync(Guid staffId)
    {
        var history = await _repository.GetMyWorkingHistoryAsync(staffId);
        return new BaseResponse<List<StaffWorkingLoggerEntity>> { IsSuccess = true, Data = history };
    }
}

/// <summary>
/// Gets the payroll history for the logged-in staff member.
/// </summary>
public class GetMyPayrollUseCase
{
    private readonly IStaffShiftRepository _repository;

    public GetMyPayrollUseCase(IStaffShiftRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<ResPayrollDto>>> ExecuteAsync(Guid staffId)
    {
        var list = await _repository.GetMyPayrollAsync(staffId);
        return new BaseResponse<List<ResPayrollDto>> { IsSuccess = true, Data = list };
    }
}
