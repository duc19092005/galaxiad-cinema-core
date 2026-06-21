using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Cinema.Application.Interfaces.Staff;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Infrastructure.Repositories;

public class StaffRepository : IStaffRepository
{
    private readonly CinemaDbContext _dbContext;

    public StaffRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<StaffProfileEntity?> GetStaffProfileByIdAsync(Guid staffId)
    {
        return await _dbContext.Set<StaffProfileEntity>().FindAsync(staffId);
    }

    public async Task<StaffProfileEntity?> GetActiveStaffProfileAsync(Guid userId)
    {
        return await _dbContext.Set<StaffProfileEntity>()
            .Include(s => s.UserInfoEntity)
            .FirstOrDefaultAsync(s => s.UserId == userId && s.WorkingStatus);
    }

    public async Task<StaffShiftRegistrationEntity?> GetApprovedShiftRegistrationAsync(Guid staffId, DateTime date)
    {
        var dateOnly = date.Date;
        return await _dbContext.Set<StaffShiftRegistrationEntity>()
            .Include(r => r.CinemaShiftTemplateEntity)
                .ThenInclude(t => t.RoleListInfoEntity)
            .FirstOrDefaultAsync(r => r.StaffId == staffId 
                                     && r.RegistrationDate == dateOnly 
                                     && r.Status == "Approved");
    }

    public async Task<CinemaShiftTemplateEntity?> GetShiftTemplateByIdAsync(Guid shiftTemplateId)
    {
        return await _dbContext.Set<CinemaShiftTemplateEntity>()
            .FirstOrDefaultAsync(t => t.ShiftTemplateId == shiftTemplateId && t.IsActive);
    }

    public async Task<List<StaffShiftRegistrationEntity>> GetActiveRegistrationsForStaffAndDateAsync(Guid staffId, DateTime date)
    {
        var dateOnly = date.Date;
        return await _dbContext.Set<StaffShiftRegistrationEntity>()
            .Include(r => r.CinemaShiftTemplateEntity)
            .Where(r => r.StaffId == staffId 
                     && r.RegistrationDate == dateOnly 
                     && (r.Status == "Approved" || r.Status == "Pending"))
            .ToListAsync();
    }

    public async Task<int> CountApprovedOrPendingRegistrationsAsync(Guid shiftTemplateId, DateTime date)
    {
        var dateOnly = date.Date;
        return await _dbContext.Set<StaffShiftRegistrationEntity>()
            .CountAsync(r => r.ShiftTemplateId == shiftTemplateId 
                             && r.RegistrationDate == dateOnly 
                             && (r.Status == "Approved" || r.Status == "Pending"));
    }

    public async Task AddShiftRegistrationAsync(StaffShiftRegistrationEntity registration)
    {
        await _dbContext.Set<StaffShiftRegistrationEntity>().AddAsync(registration);
    }

    public async Task<bool> HasActiveWorkingLogAsync(Guid staffId, DateTime date)
    {
        var dateOnly = date.Date;
        return await _dbContext.Set<StaffWorkingLoggerEntity>()
            .AnyAsync(l => l.StaffId == staffId && l.WorkingDate == dateOnly && l.EndedShiftTime == null);
    }

    public async Task<StaffWorkingLoggerEntity?> GetActiveWorkingLogAsync(Guid staffId)
    {
        return await _dbContext.Set<StaffWorkingLoggerEntity>()
            .FirstOrDefaultAsync(l => l.StaffId == staffId && l.EndedShiftTime == null);
    }

    public async Task AddWorkingLogAsync(StaffWorkingLoggerEntity workingLog)
    {
        await _dbContext.Set<StaffWorkingLoggerEntity>().AddAsync(workingLog);
    }

    public async Task<List<string>> GetUserRoleNamesAsync(Guid userId)
    {
        return await _dbContext.Set<UserRoleInfoEntity>()
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.RoleListInfoEntity.RoleName)
            .ToListAsync();
    }

    public async Task<List<Guid>> GetUserRoleIdsAsync(Guid userId)
    {
        return await _dbContext.Set<UserRoleInfoEntity>()
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.RoleId)
            .ToListAsync();
    }

    public async Task<List<string>> GetRolePermissionsAsync(IEnumerable<Guid> roleIds)
    {
        return await _dbContext.Set<PermissionForRoleEntity>()
            .Where(pr => roleIds.Contains(pr.RoleId))
            .Select(pr => pr.PermissionEntity.PermissionInfo)
            .Distinct()
            .ToListAsync();
    }

    public async Task<bool> UserHasRoleAsync(Guid userId, string roleName)
    {
        return await _dbContext.Set<UserRoleInfoEntity>()
            .AnyAsync(ur => ur.UserId == userId && ur.RoleListInfoEntity.RoleName == roleName);
    }
}
