using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager.ShiftManagement;

public class GetStaffPayrollUseCase
{
    private readonly IShiftManagerRepository _repository;
    private readonly IUserContextService _userContextService;

    public GetStaffPayrollUseCase(
        IShiftManagerRepository repository,
        IUserContextService userContextService)
    {
        _repository = repository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<List<ResPayrollDto>>> ExecuteAsync(Guid staffId)
    {
        var managerId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        var staffProfile = await _repository.GetStaffProfileAsync(staffId);
        if (staffProfile == null)
        {
            return new BaseResponse<List<ResPayrollDto>> { IsSuccess = false, Message = Messages.Staff.StaffNotFound };
        }

        if (!isAdmin)
        {
            var isManager = await _repository.IsManagerOfCinemaAsync(staffProfile.CinemaId, managerId);
            if (!isManager)
            {
                return new BaseResponse<List<ResPayrollDto>>
                {
                    IsSuccess = false,
                    Message = Messages.Staff.NoPermissionViewBranchPayroll
                };
            }
        }

        var list = await _repository.GetStaffPayrollAsync(staffId);
        return new BaseResponse<List<ResPayrollDto>> { IsSuccess = true, Data = list };
    }
}
