using System;
using Cinema.Application.Dtos.Shifts;
using Cinema.Domain.Entities.CinemaInfos;

namespace Cinema.Application.Mappers.Staff;

public static class StaffMapper
{
    public static ResShiftTemplateDto ToResShiftTemplateDto(CinemaShiftScheduleEntity s, int registeredCount)
    {
        return new ResShiftTemplateDto
        {
            ShiftTemplateId = Guid.Empty,
            ShiftScheduleId = s.ShiftScheduleId,
            CinemaId = s.CinemaId,
            CinemaName = s.CinemaInfoEntity?.CinemaName ?? "",
            ShiftName = s.ShiftName,
            StartTime = s.StartTime,
            EndTime = s.EndTime,
            MaxStaff = s.MaxStaff,
            RegisteredCount = registeredCount,
            RoleId = s.RoleId,
            RoleName = s.RoleListInfoEntity?.RoleName ?? ""
        };
    }
}
