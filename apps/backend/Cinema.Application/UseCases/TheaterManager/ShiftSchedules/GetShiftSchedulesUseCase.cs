using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces.Facilities;

namespace Cinema.Application.UseCases.TheaterManager.ShiftSchedules;

/// <summary>
/// Retrieves scheduled shifts filtered by date range and optionally department.
/// </summary>
public class GetShiftSchedulesUseCase
{
    private readonly IShiftManagerRepository _repository;

    public GetShiftSchedulesUseCase(IShiftManagerRepository repository)
    {
        _repository = repository;
    }

    public async Task<BaseResponse<List<ResShiftScheduleDto>>> ExecuteAsync(Guid cinemaId, Guid? departmentId, DateTime startDate, DateTime endDate)
    {
        var list = await _repository.GetShiftSchedulesAsync(cinemaId, departmentId, startDate, endDate);

        var dtos = list.Select(s => new ResShiftScheduleDto
        {
            ShiftScheduleId = s.ShiftScheduleId,
            CinemaId = s.CinemaId,
            DepartmentId = s.DepartmentId,
            DepartmentName = s.DepartmentEntity != null ? s.DepartmentEntity.DepartmentName : "",
            Date = s.Date,
            ShiftName = s.ShiftName,
            StartTime = s.StartTime,
            EndTime = s.EndTime,
            MaxStaff = s.MaxStaff,
            RegisteredCount = s.StaffShiftRegistrationEntities.Count(r => r.Status == "Approved" || r.Status == "Pending"),
            RoleId = s.RoleId,
            RoleName = s.RoleListInfoEntity != null ? s.RoleListInfoEntity.RoleName : "",
            DeletionStatus = s.DeletionStatus,
            DeletionReason = s.DeletionReason,
            RegisteredStaff = s.StaffShiftRegistrationEntities
                .Where(r => r.Status == "Approved" || r.Status == "Pending")
                .Select(r => new ResScheduleStaffRegistrationDto
                {
                    ShiftRegistrationId = r.ShiftRegistrationId,
                    StaffId = r.StaffId,
                    StaffName = r.StaffProfileEntity != null && r.StaffProfileEntity.UserInfoEntity != null 
                        ? r.StaffProfileEntity.UserInfoEntity.UserName : "",
                    Status = r.Status
                }).ToList()
        }).ToList();

        return new BaseResponse<List<ResShiftScheduleDto>>
        {
            IsSuccess = true,
            Data = dtos
        };
    }
}
