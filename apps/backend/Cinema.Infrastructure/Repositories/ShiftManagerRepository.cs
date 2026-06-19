using Cinema.Application.Dtos.Shifts;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Facilities;
using Microsoft.EntityFrameworkCore;

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
        return await _dbContext.Set<CinemaShiftTemplateEntity>()
            .Include(t => t.RoleListInfoEntity)
            .Where(t => t.CinemaId == cinemaId && t.IsActive)
            .Select(t => new ResShiftTemplateDto
            {
                ShiftTemplateId = t.ShiftTemplateId,
                CinemaId = t.CinemaId,
                CinemaName = t.CinemaInfoEntity != null ? t.CinemaInfoEntity.CinemaName : "",
                ShiftName = t.ShiftName,
                StartTime = t.StartTime,
                EndTime = t.EndTime,
                MaxStaff = t.MaxStaff,
                RoleId = t.RoleId,
                RoleName = t.RoleListInfoEntity != null ? t.RoleListInfoEntity.RoleName : ""
            })
            .ToListAsync();
    }

    public async Task<List<ResStaffShiftRegistrationDto>> GetShiftRegistrationsAsync(Guid cinemaId, string? status)
    {
        var query = _dbContext.Set<StaffShiftRegistrationEntity>()
            .Include(r => r.StaffProfileEntity.UserInfoEntity)
            .Include(r => r.CinemaShiftTemplateEntity)
            .Where(r => r.CinemaShiftTemplateEntity.CinemaId == cinemaId);

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(r => r.Status == status);
        }

        return await query
            .OrderByDescending(r => r.RegistrationDate)
            .Select(r => new ResStaffShiftRegistrationDto
            {
                ShiftRegistrationId = r.ShiftRegistrationId,
                StaffId = r.StaffId,
                StaffName = r.StaffProfileEntity != null && r.StaffProfileEntity.UserInfoEntity != null
                    ? r.StaffProfileEntity.UserInfoEntity.UserName : "",
                ShiftTemplateId = r.ShiftTemplateId,
                ShiftName = r.CinemaShiftTemplateEntity != null ? r.CinemaShiftTemplateEntity.ShiftName : "",
                StartTime = r.CinemaShiftTemplateEntity != null ? r.CinemaShiftTemplateEntity.StartTime : default,
                EndTime = r.CinemaShiftTemplateEntity != null ? r.CinemaShiftTemplateEntity.EndTime : default,
                RegistrationDate = r.RegistrationDate,
                Status = r.Status,
                ApprovedAt = r.ApprovedAt,
                Notes = r.Notes
            })
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
                HasFaceRegistered = !string.IsNullOrEmpty(s.FaceVector)
            })
            .ToListAsync();
    }

    public async Task<StaffProfileEntity?> GetStaffProfileAsync(Guid userId)
    {
        return await _dbContext.Set<StaffProfileEntity>()
            .FirstOrDefaultAsync(s => s.UserId == userId);
    }

    public async Task UpdateStaffProfileAsync(StaffProfileEntity staff, ReqUpdateStaffProfileDto dto)
    {
        staff.WorkingStatus = dto.WorkingStatus;
        staff.CinemaId = dto.CinemaId;
        staff.IsCinemaManager = dto.IsCinemaManager;
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

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
