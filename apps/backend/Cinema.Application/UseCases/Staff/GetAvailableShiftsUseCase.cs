using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Application.Mappers.Staff;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Staff;

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
                Message = Messages.Staff.AccountNotLinkedToCinema
            };
        }

        if (!staffProfile.DepartmentId.HasValue)
        {
            return new BaseResponse<List<ResShiftTemplateDto>>
            {
                IsSuccess = true,
                Data = new List<ResShiftTemplateDto>(),
                Message = Messages.Staff.NoDepartmentAssigned
            };
        }

        var registrationDateOnly = date.Date;
        var schedules = await _repository.GetActiveShiftSchedulesForCinemaAndDepartmentAsync(
            staffProfile.CinemaId, staffProfile.DepartmentId.Value, registrationDateOnly);

        var resultList = new List<ResShiftTemplateDto>();
        foreach (var s in schedules)
        {
            var count = await _repository.CountApprovedOrPendingRegistrationsForScheduleAsync(s.ShiftScheduleId);
            resultList.Add(StaffMapper.ToResShiftTemplateDto(s, count));
        }

        return new BaseResponse<List<ResShiftTemplateDto>> { IsSuccess = true, Data = resultList };
    }
}
