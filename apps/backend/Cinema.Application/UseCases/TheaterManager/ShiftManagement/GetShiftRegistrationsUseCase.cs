using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager.ShiftManagement;

public class GetShiftRegistrationsUseCase
{
    private readonly IShiftManagerRepository _repository;
    private readonly IUserContextService _userContextService;

    public GetShiftRegistrationsUseCase(
        IShiftManagerRepository repository,
        IUserContextService userContextService)
    {
        _repository = repository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<List<ResStaffShiftRegistrationDto>>> ExecuteAsync(Guid cinemaId, string? status)
    {
        var managerId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        if (!isAdmin)
        {
            var isManager = await _repository.IsManagerOfCinemaAsync(cinemaId, managerId);
            if (!isManager)
            {
                return new BaseResponse<List<ResStaffShiftRegistrationDto>>
                {
                    IsSuccess = false,
                    Message = Messages.Staff.NoPermissionViewBranchStaff
                };
            }
        }

        var list = await _repository.GetShiftRegistrationsAsync(cinemaId, status);
        return new BaseResponse<List<ResStaffShiftRegistrationDto>> { IsSuccess = true, Data = list };
    }
}
