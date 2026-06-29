using Cinema.Application.Dtos.Shifts;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Utils;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Repositories;

public class StaffShiftRepository : IStaffShiftRepository
{
    private readonly CinemaDbContext _dbContext;

    public StaffShiftRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<StaffProfileEntity?> GetStaffProfileByUserIdAsync(Guid userId)
    {
        return await _dbContext.Set<StaffProfileEntity>()
            .FirstOrDefaultAsync(s => s.UserId == userId && s.WorkingStatus);
    }

    public async Task<List<CinemaShiftTemplateEntity>> GetActiveShiftTemplatesForCinemaAsync(Guid cinemaId)
    {
        return await _dbContext.Set<CinemaShiftTemplateEntity>()
            .Include(t => t.RoleListInfoEntity)
            .Where(t => t.CinemaId == cinemaId && t.IsActive)
            .ToListAsync();
    }

    public async Task<int> CountApprovedOrPendingRegistrationsAsync(Guid shiftTemplateId, DateTime date)
    {
        return await _dbContext.Set<StaffShiftRegistrationEntity>()
            .CountAsync(r => r.ShiftTemplateId == shiftTemplateId
                             && r.RegistrationDate == date.Date
                             && (r.Status == "Approved" || r.Status == "Pending"));
    }


    public async Task<List<ResStaffShiftRegistrationDto>> GetMyRegistrationsAsync(Guid staffId)
    {
        // Load raw entities first (cannot call DateTimeHelper in EF query tree)
        var rawList = await _dbContext.Set<StaffShiftRegistrationEntity>()
            .Include(r => r.CinemaShiftTemplateEntity)
            .Include(r => r.CinemaShiftScheduleEntity)
            .Include(r => r.StaffProfileEntity!.UserInfoEntity)
            .Where(r => r.StaffId == staffId)
            .OrderByDescending(r => r.RegistrationDate)
            .ToListAsync();

        // Convert UTC dates and times to Vietnam time (UTC+7) before returning to FE
        return rawList.Select(r => 
        {
            var startTimeUtc = r.CinemaShiftTemplateEntity?.StartTime ?? r.CinemaShiftScheduleEntity?.StartTime ?? default;
            var endTimeUtc = r.CinemaShiftTemplateEntity?.EndTime ?? r.CinemaShiftScheduleEntity?.EndTime ?? default;

            // Reconstruct full DateTime to safely convert using DateTimeHelper
            var utcStart = r.RegistrationDate.Date + startTimeUtc;
            var utcEnd = r.RegistrationDate.Date + endTimeUtc;
            if (endTimeUtc <= startTimeUtc)
            {
                utcEnd = utcEnd.AddDays(1);
            }

            var localStart = DateTimeHelper.ToVietnamTime(utcStart);
            var localEnd = DateTimeHelper.ToVietnamTime(utcEnd);

            return new ResStaffShiftRegistrationDto
            {
                ShiftRegistrationId = r.ShiftRegistrationId,
                StaffId = r.StaffId,
                StaffName = r.StaffProfileEntity?.UserInfoEntity?.UserName ?? "",
                ShiftTemplateId = r.ShiftTemplateId ?? Guid.Empty,
                ShiftName = r.CinemaShiftTemplateEntity?.ShiftName ?? r.CinemaShiftScheduleEntity?.ShiftName ?? "",
                StartTime = localStart.TimeOfDay,
                EndTime = localEnd.TimeOfDay,
                // Make sure date-only field is exactly at local 00:00:00 (no 07:00:00 offset)
                RegistrationDate = DateTimeHelper.ToVietnamTime(r.RegistrationDate).Date,
                Status = r.Status,
                ApprovedAt = DateTimeHelper.ToVietnamTime(r.ApprovedAt),
                Notes = r.Notes
            };
        }).OrderByDescending(r => r.RegistrationDate).ToList();
    }


    public async Task<StaffShiftRegistrationEntity?> GetRegistrationByIdAndStaffAsync(Guid registrationId, Guid staffId)
    {
        return await _dbContext.Set<StaffShiftRegistrationEntity>()
            .FirstOrDefaultAsync(r => r.ShiftRegistrationId == registrationId && r.StaffId == staffId);
    }

    public async Task<List<StaffShiftRegistrationEntity>> GetPendingRegistrationsByIdsAsync(List<Guid> ids, Guid staffId)
    {
        return await _dbContext.Set<StaffShiftRegistrationEntity>()
            .Where(r => ids.Contains(r.ShiftRegistrationId) && r.StaffId == staffId)
            .ToListAsync();
    }

    public Task RemoveRegistrationAsync(StaffShiftRegistrationEntity registration)
    {
        _dbContext.Set<StaffShiftRegistrationEntity>().Remove(registration);
        return Task.CompletedTask;
    }

    public Task RemoveRegistrationsAsync(List<StaffShiftRegistrationEntity> registrations)
    {
        _dbContext.Set<StaffShiftRegistrationEntity>().RemoveRange(registrations);
        return Task.CompletedTask;
    }

    public async Task<List<StaffWorkingLoggerEntity>> GetMyWorkingHistoryAsync(Guid staffId)
    {
        return await _dbContext.Set<StaffWorkingLoggerEntity>()
            .Include(l => l.RoleListInfoEntity)
            .Where(l => l.StaffId == staffId)
            .OrderByDescending(l => l.WorkingDate)
            .ThenByDescending(l => l.StartedShiftTime)
            .ToListAsync();
    }

    public async Task<List<OrderInfoEntity>> GetTicketSalesForWorkingLogsAsync(Guid staffId, List<StaffWorkingLoggerEntity> logs)
    {
        if (logs.Count == 0) return [];

        var from = logs.Min(l => l.StartedShiftTime);
        var to = logs.Max(l => l.EndedShiftTime ?? DateTime.UtcNow);

        return await _dbContext.Set<OrderInfoEntity>()
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(d => d.MovieScheduleInfoEntity!)
                    .ThenInclude(s => s.MovieInfoEntity!)
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(d => d.MovieScheduleInfoEntity!)
                    .ThenInclude(s => s.AuditoriumInfoEntities!)
                        .ThenInclude(a => a.CinemaInfoEntity!)
            .Include(o => o.OrderDetailsInfo)
                .ThenInclude(d => d.SeatsInfoEntity!)
            .Where(o => o.StaffId == staffId && o.OrderDate >= from && o.OrderDate <= to)
            .OrderByDescending(o => o.OrderDate)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<ResPayrollDto>> GetMyPayrollAsync(Guid staffId)
    {
        // Load raw entities then convert UTC → VN time in-memory
        var rawList = await _dbContext.Set<StaffSalaryTotalLoggerEntity>()
            .Include(p => p.PaidByUser)
            .Include(p => p.StaffProfileEntity!.UserInfoEntity)
            .Include(p => p.StaffWorkingLoggerEntities)
            .Where(p => p.StaffId == staffId)
            .OrderByDescending(p => p.ReceivedDay)
            .ToListAsync();

        return rawList.Select(p => new ResPayrollDto
        {
            SalaryTotalLoggerId = p.SalaryTotalLoggerId,
            TotalReceived = p.TotalReceived,
            ReceivedDay = DateTimeHelper.ToVietnamTime(p.ReceivedDay),
            StaffId = p.StaffId,
            StaffName = p.StaffProfileEntity?.UserInfoEntity?.UserName ?? "",
            PaidByUserId = p.PaidByUserId,
            PaidByName = p.PaidByUser?.UserName,
            PaymentStatus = p.PaymentStatus,
            WorkingLogs = p.StaffWorkingLoggerEntities.Select(l => new ResStaffWorkingLogDto
            {
                StaffWorkingLoggerId = l.StaffWorkingLoggerId,
                SalaryPerHour = l.SalaryPerHour,
                WorkingHour = l.WorkingHour,
                StartedShiftTime = DateTimeHelper.ToVietnamTime(l.StartedShiftTime),
                EndedShiftTime = DateTimeHelper.ToVietnamTime(l.EndedShiftTime),
                WorkingDate = DateTimeHelper.ToVietnamTime(l.WorkingDate),
                TotalReceived = l.TotalReceived
            }).ToList()
        }).ToList();
    }

    public async Task<int> CountApprovedOrPendingRegistrationsForScheduleAsync(Guid shiftScheduleId)
    {
        return await _dbContext.Set<StaffShiftRegistrationEntity>()
            .CountAsync(r => r.ShiftScheduleId == shiftScheduleId 
                             && (r.Status == "Approved" || r.Status == "Pending"));
    }

    public async Task<List<CinemaShiftScheduleEntity>> GetActiveShiftSchedulesForCinemaAndDepartmentAsync(Guid cinemaId, Guid departmentId, DateTime date)
    {
        var dateOnly = date.Date;
        var startUtcLimit = dateOnly.AddDays(-1);
        var endUtcLimit = dateOnly.AddDays(1);

        var rawList = await _dbContext.Set<CinemaShiftScheduleEntity>()
            .Include(s => s.RoleListInfoEntity)
            .Include(s => s.DepartmentEntity)
            .Include(s => s.StaffShiftRegistrationEntities)
            .Where(s => s.CinemaId == cinemaId 
                     && s.DepartmentId == departmentId 
                     && s.Date >= startUtcLimit
                     && s.Date <= endUtcLimit
                     && s.IsActive 
                     && s.DeletionStatus == "Active")
            .ToListAsync();

        // Filter in-memory using local Vietnam time conversion
        return rawList.Where(s => 
        {
            var utcStart = s.Date.Date + s.StartTime;
            var localStart = DateTimeHelper.ToVietnamTime(utcStart);
            return localStart.Date == dateOnly;
        }).ToList();
    }

    public async Task<CinemaShiftScheduleEntity?> GetShiftScheduleByIdAsync(Guid shiftScheduleId)
    {
        return await _dbContext.Set<CinemaShiftScheduleEntity>()
            .Include(s => s.RoleListInfoEntity)
            .Include(s => s.DepartmentEntity)
            .FirstOrDefaultAsync(s => s.ShiftScheduleId == shiftScheduleId && s.IsActive);
    }
}
