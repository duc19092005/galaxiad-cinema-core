using Cinema.Application.Dtos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Facilities;

namespace Cinema.Application.UseCases.Staff;

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

