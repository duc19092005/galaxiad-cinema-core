using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces.Facilities;

namespace Cinema.Application.UseCases.Staff;

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

