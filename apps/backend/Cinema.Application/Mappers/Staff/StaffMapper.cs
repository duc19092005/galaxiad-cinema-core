using System;
using Cinema.Application.Dtos.Shifts;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Utils;

namespace Cinema.Application.Mappers.Staff;

public static class StaffMapper
{
    public static ResShiftTemplateDto ToResShiftTemplateDto(CinemaShiftScheduleEntity s, int registeredCount)
    {
        // Reconstruct UTC start/end DateTime and convert to Vietnam Local time (UTC+7)
        var utcStart = s.Date.Date + s.StartTime;
        var utcEnd = s.Date.Date + s.EndTime;
        if (s.EndTime <= s.StartTime)
        {
            utcEnd = utcEnd.AddDays(1);
        }

        var localStart = DateTimeHelper.ToVietnamTime(utcStart);
        var localEnd = DateTimeHelper.ToVietnamTime(utcEnd);

        return new ResShiftTemplateDto
        {
            ShiftTemplateId = Guid.Empty,
            ShiftScheduleId = s.ShiftScheduleId,
            CinemaId = s.CinemaId,
            CinemaName = s.CinemaInfoEntity?.CinemaName ?? "",
            ShiftName = s.ShiftName,
            StartTime = localStart.TimeOfDay,
            EndTime = localEnd.TimeOfDay,
            MaxStaff = s.MaxStaff,
            RegisteredCount = registeredCount,
            RoleId = s.RoleId,
            RoleName = s.RoleListInfoEntity?.RoleName ?? "",
            ShiftType = s.ShiftType
        };
    }
}

