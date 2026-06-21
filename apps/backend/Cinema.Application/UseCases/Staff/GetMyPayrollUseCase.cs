using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces.Facilities;

namespace Cinema.Application.UseCases.Staff;

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

