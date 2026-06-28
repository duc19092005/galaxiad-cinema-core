using Cinema.Application.Dtos.Shifts;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Facilities;
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
        return await _dbContext.Set<StaffShiftRegistrationEntity>()
            .Include(r => r.CinemaShiftTemplateEntity)
            .Include(r => r.CinemaShiftScheduleEntity)
            .Where(r => r.StaffId == staffId)
            .OrderByDescending(r => r.RegistrationDate)
            .Select(r => new ResStaffShiftRegistrationDto
            {
                ShiftRegistrationId = r.ShiftRegistrationId,
                StaffId = r.StaffId,
                StaffName = r.StaffProfileEntity != null && r.StaffProfileEntity.UserInfoEntity != null
                    ? r.StaffProfileEntity.UserInfoEntity.UserName : "",
                ShiftTemplateId = r.ShiftTemplateId ?? Guid.Empty,
                ShiftName = r.CinemaShiftTemplateEntity != null ? r.CinemaShiftTemplateEntity.ShiftName : (r.CinemaShiftScheduleEntity != null ? r.CinemaShiftScheduleEntity.ShiftName : ""),
                StartTime = r.CinemaShiftTemplateEntity != null ? r.CinemaShiftTemplateEntity.StartTime : (r.CinemaShiftScheduleEntity != null ? r.CinemaShiftScheduleEntity.StartTime : default),
                EndTime = r.CinemaShiftTemplateEntity != null ? r.CinemaShiftTemplateEntity.EndTime : (r.CinemaShiftScheduleEntity != null ? r.CinemaShiftScheduleEntity.EndTime : default),
                RegistrationDate = r.RegistrationDate,
                Status = r.Status,
                ApprovedAt = r.ApprovedAt,
                Notes = r.Notes
            })
            .ToListAsync();
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

    public async Task<List<ResPayrollDto>> GetMyPayrollAsync(Guid staffId)
    {
        return await _dbContext.Set<StaffSalaryTotalLoggerEntity>()
            .Include(p => p.PaidByUser)
            .Where(p => p.StaffId == staffId)
            .OrderByDescending(p => p.ReceivedDay)
            .Select(p => new ResPayrollDto
            {
                SalaryTotalLoggerId = p.SalaryTotalLoggerId,
                TotalReceived = p.TotalReceived,
                ReceivedDay = p.ReceivedDay,
                StaffId = p.StaffId,
                StaffName = p.StaffProfileEntity != null && p.StaffProfileEntity.UserInfoEntity != null
                    ? p.StaffProfileEntity.UserInfoEntity.UserName : "",
                PaidByUserId = p.PaidByUserId,
                PaidByName = p.PaidByUser != null ? p.PaidByUser.UserName : null,
                PaymentStatus = p.PaymentStatus,
                WorkingLogs = p.StaffWorkingLoggerEntities.Select(l => new ResStaffWorkingLogDto
                {
                    StaffWorkingLoggerId = l.StaffWorkingLoggerId,
                    SalaryPerHour = l.SalaryPerHour,
                    WorkingHour = l.WorkingHour,
                    StartedShiftTime = l.StartedShiftTime,
                    EndedShiftTime = l.EndedShiftTime,
                    WorkingDate = l.WorkingDate,
                    TotalReceived = l.TotalReceived
                }).ToList()
            })
            .ToListAsync();
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
        return await _dbContext.Set<CinemaShiftScheduleEntity>()
            .Include(s => s.RoleListInfoEntity)
            .Include(s => s.DepartmentEntity)
            .Include(s => s.StaffShiftRegistrationEntities)
            .Where(s => s.CinemaId == cinemaId 
                     && s.DepartmentId == departmentId 
                     && s.Date == dateOnly 
                     && s.IsActive 
                     && s.DeletionStatus == "Active")
            .ToListAsync();
    }

    public async Task<CinemaShiftScheduleEntity?> GetShiftScheduleByIdAsync(Guid shiftScheduleId)
    {
        return await _dbContext.Set<CinemaShiftScheduleEntity>()
            .Include(s => s.RoleListInfoEntity)
            .Include(s => s.DepartmentEntity)
            .FirstOrDefaultAsync(s => s.ShiftScheduleId == shiftScheduleId && s.IsActive);
    }
}
