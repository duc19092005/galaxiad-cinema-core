using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Dtos.Shifts;
using Cinema.Application.Interfaces.Facilities;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Utils;
using Cinema.Domain.Enums;

namespace Cinema.Infrastructure.Repositories;

public class ShiftManagerRepository : IShiftManagerRepository
{
    private readonly CinemaDbContext _dbContext;

    public ShiftManagerRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> IsManagerOfCinemaAsync(Guid cinemaId, Guid userId)
    {
        var profile = await _dbContext.Set<StaffProfileEntity>()
            .FirstOrDefaultAsync(s => s.UserId == userId && s.WorkingStatus);
        return profile != null && profile.CinemaId == cinemaId;
    }

    public async Task AddShiftTemplateAsync(CinemaShiftTemplateEntity template)
    {
        await _dbContext.Set<CinemaShiftTemplateEntity>().AddAsync(template);
    }

    public async Task<List<ResShiftTemplateDto>> GetShiftTemplatesAsync(Guid cinemaId)
    {
        var templates = await _dbContext.Set<CinemaShiftTemplateEntity>()
            .Include(t => t.RoleListInfoEntity)
            .Where(t => t.CinemaId == cinemaId && t.IsActive)
            .ToListAsync();

        return templates.Select(t => {
            var dummyDate = DateTime.Today;
            var utcStart = dummyDate + t.StartTime;
            var utcEnd = dummyDate + t.EndTime;
            if (t.EndTime <= t.StartTime)
            {
                utcEnd = utcEnd.AddDays(1);
            }

            var localStart = DateTimeHelper.ToVietnamTime(utcStart);
            var localEnd = DateTimeHelper.ToVietnamTime(utcEnd);

            return new ResShiftTemplateDto
            {
                ShiftTemplateId = t.ShiftTemplateId,
                CinemaId = t.CinemaId,
                CinemaName = t.CinemaInfoEntity != null ? t.CinemaInfoEntity.CinemaName : "",
                ShiftName = t.ShiftName,
                StartTime = localStart.TimeOfDay,
                EndTime = localEnd.TimeOfDay,
                MaxStaff = t.MaxStaff,
                RoleId = t.RoleId,
                RoleName = t.RoleListInfoEntity != null ? t.RoleListInfoEntity.RoleName : "",
                ShiftType = t.ShiftType
            };
        }).ToList();
    }

    public async Task<List<ResStaffShiftRegistrationDto>> GetShiftRegistrationsAsync(Guid cinemaId, string? status)
    {
        var query = _dbContext.Set<StaffShiftRegistrationEntity>()
            .Include(r => r.StaffProfileEntity.UserInfoEntity)
            .Include(r => r.CinemaShiftTemplateEntity)
            .Include(r => r.CinemaShiftScheduleEntity)
            .Where(r => (r.CinemaShiftTemplateEntity != null && r.CinemaShiftTemplateEntity.CinemaId == cinemaId)
                     || (r.CinemaShiftScheduleEntity != null && r.CinemaShiftScheduleEntity.CinemaId == cinemaId));

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(r => r.Status == status);
        }

        var list = await query
            .OrderByDescending(r => r.RegistrationDate)
            .ToListAsync();

        return list.Select(r => {
            var date = r.RegistrationDate.Date;
            TimeSpan startTime = default;
            TimeSpan endTime = default;

            if (r.CinemaShiftTemplateEntity != null)
            {
                startTime = r.CinemaShiftTemplateEntity.StartTime;
                endTime = r.CinemaShiftTemplateEntity.EndTime;
            }
            else if (r.CinemaShiftScheduleEntity != null)
            {
                startTime = r.CinemaShiftScheduleEntity.StartTime;
                endTime = r.CinemaShiftScheduleEntity.EndTime;
            }

            var utcStart = date + startTime;
            var utcEnd = date + endTime;
            if (endTime <= startTime)
            {
                utcEnd = utcEnd.AddDays(1);
            }

            var localStart = DateTimeHelper.ToVietnamTime(utcStart);
            var localEnd = DateTimeHelper.ToVietnamTime(utcEnd);

            return new ResStaffShiftRegistrationDto
            {
                ShiftRegistrationId = r.ShiftRegistrationId,
                StaffId = r.StaffId,
                StaffName = r.StaffProfileEntity != null && r.StaffProfileEntity.UserInfoEntity != null
                    ? r.StaffProfileEntity.UserInfoEntity.UserName : "",
                ShiftTemplateId = r.ShiftTemplateId ?? Guid.Empty,
                ShiftName = r.CinemaShiftTemplateEntity != null ? r.CinemaShiftTemplateEntity.ShiftName : (r.CinemaShiftScheduleEntity != null ? r.CinemaShiftScheduleEntity.ShiftName : ""),
                StartTime = localStart.TimeOfDay,
                EndTime = localEnd.TimeOfDay,
                RegistrationDate = localStart.Date,
                Status = r.Status,
                ApprovedAt = r.ApprovedAt.HasValue ? DateTimeHelper.ToVietnamTime(r.ApprovedAt.Value) : null,
                Notes = r.Notes
            };
        }).ToList();
    }

    public async Task<StaffShiftRegistrationEntity?> GetRegistrationByIdWithTemplateAsync(Guid registrationId)
    {
        return await _dbContext.Set<StaffShiftRegistrationEntity>()
            .Include(r => r.CinemaShiftTemplateEntity)
            .Include(r => r.CinemaShiftScheduleEntity)
            .Include(r => r.StaffProfileEntity)
            .FirstOrDefaultAsync(r => r.ShiftRegistrationId == registrationId);
    }

    public async Task<int> CountApprovedRegistrationsAsync(Guid shiftTemplateId, DateTime date)
    {
        return await _dbContext.Set<StaffShiftRegistrationEntity>()
            .CountAsync(r => r.ShiftTemplateId == shiftTemplateId 
                             && r.RegistrationDate == date.Date 
                             && r.Status == "Approved");
    }

    public async Task<CinemaShiftTemplateEntity?> GetShiftTemplateByIdAsync(Guid shiftTemplateId)
    {
        return await _dbContext.Set<CinemaShiftTemplateEntity>()
            .FirstOrDefaultAsync(t => t.ShiftTemplateId == shiftTemplateId && t.IsActive);
    }

    public async Task AddShiftRegistrationAsync(StaffShiftRegistrationEntity registration)
    {
        await _dbContext.Set<StaffShiftRegistrationEntity>().AddAsync(registration);
    }

    public async Task<List<StaffShiftRegistrationEntity>> GetActiveRegistrationsForStaffAndDateAsync(Guid staffId, DateTime date)
    {
        var registrationDateOnly = date.Date;
        return await _dbContext.Set<StaffShiftRegistrationEntity>()
            .Include(r => r.CinemaShiftTemplateEntity)
            .Where(r => r.StaffId == staffId 
                     && r.RegistrationDate == registrationDateOnly 
                     && (r.Status == "Approved" || r.Status == "Pending"))
            .ToListAsync();
    }

    public async Task<List<ResStaffProfileDto>> GetStaffProfilesAsync(Guid cinemaId)
    {
        return await _dbContext.Set<StaffProfileEntity>()
            .Include(s => s.UserInfoEntity)
            .Where(s => s.CinemaId == cinemaId)
            .Select(s => new ResStaffProfileDto
            {
                UserId = s.UserId,
                UserName = s.UserInfoEntity != null ? s.UserInfoEntity.UserName : "",
                Email = s.UserInfoEntity != null ? s.UserInfoEntity.UserEmail : "",
                PortraitImageUrl = s.UserInfoEntity != null ? s.UserInfoEntity.PortraitImageUrl : null,
                WorkingStatus = s.WorkingStatus,
                CinemaId = s.CinemaId,
                CinemaName = s.CinemaInfoEntity != null ? s.CinemaInfoEntity.CinemaName : "",
                DepartmentId = s.DepartmentId,
                DepartmentName = s.DepartmentEntity != null ? s.DepartmentEntity.DepartmentName : null,
                IsCinemaManager = s.IsCinemaManager,
                HasFaceRegistered = !string.IsNullOrEmpty(s.FaceVector),
                EmployeeType = s.EmployeeType
            })
            .ToListAsync();
    }

    public async Task<List<Guid>> GetStaffUserIdsInDepartmentAsync(Guid cinemaId, Guid departmentId)
    {
        return await _dbContext.Set<StaffProfileEntity>()
            .Where(s => s.CinemaId == cinemaId && s.DepartmentId == departmentId && s.WorkingStatus)
            .Select(s => s.UserId)
            .ToListAsync();
    }

    public async Task<StaffProfileEntity?> GetStaffProfileAsync(Guid userId)
    {
        return await _dbContext.Set<StaffProfileEntity>()
            .FirstOrDefaultAsync(s => s.UserId == userId);
    }

    public async Task<StaffProfileEntity?> GetStaffProfileWithUserAsync(Guid userId)
    {
        return await _dbContext.Set<StaffProfileEntity>()
            .Include(s => s.UserInfoEntity)
            .FirstOrDefaultAsync(s => s.UserId == userId && s.WorkingStatus);
    }

    public Task UpdateStaffProfileAsync(StaffProfileEntity staff, ReqUpdateStaffProfileDto dto)
    {
        staff.WorkingStatus = dto.WorkingStatus;
        staff.CinemaId = dto.CinemaId;
        staff.IsCinemaManager = dto.IsCinemaManager;
        if (dto.EmployeeType.HasValue)
        {
            staff.EmployeeType = dto.EmployeeType.Value;
        }
        return Task.CompletedTask;
    }

    public async Task<List<ResPayrollDto>> GetStaffPayrollAsync(Guid staffId)
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

    public async Task<List<ResPayrollDto>> GetCinemaPayrollAsync(Guid cinemaId)
    {
        return await _dbContext.Set<StaffSalaryTotalLoggerEntity>()
            .Include(p => p.PaidByUser)
            .Include(p => p.StaffProfileEntity.UserInfoEntity)
            .Where(p => p.StaffProfileEntity.CinemaId == cinemaId)
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

    public async Task<List<StaffWorkingLoggerEntity>> GetUncalculatedWorkingLogsAsync(Guid staffId, DateTime upToDate)
    {
        return await _dbContext.Set<StaffWorkingLoggerEntity>()
            .Where(l => l.StaffId == staffId 
                     && l.EndedShiftTime != null 
                     && l.SalaryTotalLoggerId == null 
                     && l.WorkingDate <= upToDate.Date)
            .ToListAsync();
    }

    public async Task AddSalaryTotalLogAsync(StaffSalaryTotalLoggerEntity payroll)
    {
        await _dbContext.Set<StaffSalaryTotalLoggerEntity>().AddAsync(payroll);
    }

    public async Task<StaffSalaryTotalLoggerEntity?> GetSalaryTotalLogByIdAsync(Guid payrollId)
    {
        return await _dbContext.Set<StaffSalaryTotalLoggerEntity>()
            .Include(p => p.StaffProfileEntity)
            .FirstOrDefaultAsync(p => p.SalaryTotalLoggerId == payrollId);
    }

    public async Task<bool> UserHasRoleAsync(Guid userId, string roleName)
    {
        return await _dbContext.Set<UserRoleInfoEntity>()
            .AnyAsync(ur => ur.UserId == userId && ur.RoleListInfoEntity.RoleName == roleName);
    }

    public async Task<int> CountApprovedRegistrationsForScheduleAsync(Guid shiftScheduleId)
    {
        return await _dbContext.Set<StaffShiftRegistrationEntity>()
            .CountAsync(r => r.ShiftScheduleId == shiftScheduleId && r.Status == "Approved");
    }

    public async Task<int> CountApprovedOrPendingRegistrationsForScheduleAsync(Guid shiftScheduleId)
    {
        return await _dbContext.Set<StaffShiftRegistrationEntity>()
            .CountAsync(r => r.ShiftScheduleId == shiftScheduleId && (r.Status == "Approved" || r.Status == "Pending"));
    }

    public async Task AddShiftScheduleAsync(CinemaShiftScheduleEntity schedule)
    {
        await _dbContext.Set<CinemaShiftScheduleEntity>().AddAsync(schedule);
    }

    public async Task<CinemaShiftScheduleEntity?> GetShiftScheduleByIdAsync(Guid shiftScheduleId)
    {
        return await _dbContext.Set<CinemaShiftScheduleEntity>()
            .Include(s => s.RoleListInfoEntity)
            .Include(s => s.DepartmentEntity)
            .Include(s => s.StaffShiftRegistrationEntities)
                .ThenInclude(r => r.StaffProfileEntity.UserInfoEntity)
            .FirstOrDefaultAsync(s => s.ShiftScheduleId == shiftScheduleId && s.IsActive);
    }

    public async Task<List<CinemaShiftScheduleEntity>> GetShiftSchedulesAsync(Guid cinemaId, Guid? departmentId, DateTime startDate, DateTime endDate)
    {
        var startOnly = startDate.Date;
        var endOnly = endDate.Date;
        var query = _dbContext.Set<CinemaShiftScheduleEntity>()
            .Include(s => s.RoleListInfoEntity)
            .Include(s => s.DepartmentEntity)
            .Include(s => s.StaffShiftRegistrationEntities)
                .ThenInclude(r => r.StaffProfileEntity.UserInfoEntity)
            .Where(s => s.CinemaId == cinemaId && s.Date >= startOnly && s.Date <= endOnly && s.IsActive);

        if (departmentId.HasValue)
        {
            query = query.Where(s => s.DepartmentId == departmentId.Value);
        }

        return await query.OrderBy(s => s.Date).ThenBy(s => s.StartTime).ToListAsync();
    }

    public async Task<List<CinemaShiftScheduleEntity>> GetPendingDeletionRequestsAsync()
    {
        return await _dbContext.Set<CinemaShiftScheduleEntity>()
            .Include(s => s.RoleListInfoEntity)
            .Include(s => s.DepartmentEntity)
            .Include(s => s.CinemaInfoEntity)
            .Where(s => s.DeletionStatus == "PendingDeletion" && s.IsActive)
            .OrderByDescending(s => s.DeletionRequestedAt)
            .ToListAsync();
    }
}
