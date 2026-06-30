using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager.ShiftManagement;

public class GetStaffProfilesUseCase
{
    private readonly IShiftManagerRepository _repository;
    private readonly IUserContextService _userContextService;

    public GetStaffProfilesUseCase(
        IShiftManagerRepository repository,
        IUserContextService userContextService)
    {
        _repository = repository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<List<ResStaffProfileDto>>> ExecuteAsync(Guid cinemaId)
    {
        var managerId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        if (!isAdmin)
        {
            var isManager = await _repository.IsManagerOfCinemaAsync(cinemaId, managerId);
            if (!isManager)
            {
                return new BaseResponse<List<ResStaffProfileDto>>
                {
                    IsSuccess = false,
                    Message = Messages.Staff.NoPermissionManageBranchStaff
                };
            }
        }

        var list = await _repository.GetStaffProfilesAsync(cinemaId);
        return new BaseResponse<List<ResStaffProfileDto>> { IsSuccess = true, Data = list };
    }
}
