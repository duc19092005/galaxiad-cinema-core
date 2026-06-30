using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.TheaterManager.ShiftManagement;

public class GetCinemaPayrollUseCase
{
    private readonly IShiftManagerRepository _repository;
    private readonly IUserContextService _userContextService;

    public GetCinemaPayrollUseCase(
        IShiftManagerRepository repository,
        IUserContextService userContextService)
    {
        _repository = repository;
        _userContextService = userContextService;
    }

    public async Task<BaseResponse<List<ResPayrollDto>>> ExecuteAsync(Guid cinemaId)
    {
        var managerId = _userContextService.GetUserId();
        var isAdmin = _userContextService.IsInRole("Admin");

        if (!isAdmin)
        {
            var isManager = await _repository.IsManagerOfCinemaAsync(cinemaId, managerId);
            if (!isManager)
            {
                return new BaseResponse<List<ResPayrollDto>>
                {
                    IsSuccess = false,
                    Message = Messages.Staff.NoPermissionViewBranchPayroll
                };
            }
        }

        var list = await _repository.GetCinemaPayrollAsync(cinemaId);
        return new BaseResponse<List<ResPayrollDto>> { IsSuccess = true, Data = list };
    }
}
