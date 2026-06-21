using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces.Facilities;
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
