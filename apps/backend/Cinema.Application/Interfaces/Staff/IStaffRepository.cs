using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Application.Interfaces.Staff;

public interface IStaffRepository
{
    // Profile
    Task<StaffProfileEntity?> GetStaffProfileByIdAsync(Guid staffId);
    Task<StaffProfileEntity?> GetActiveStaffProfileAsync(Guid userId);
    
    // Shifts & Registrations
    Task<StaffShiftRegistrationEntity?> GetApprovedShiftRegistrationAsync(Guid staffId, DateTime date);
    Task<CinemaShiftTemplateEntity?> GetShiftTemplateByIdAsync(Guid shiftTemplateId);
    Task<List<StaffShiftRegistrationEntity>> GetActiveRegistrationsForStaffAndDateAsync(Guid staffId, DateTime date);
    Task<int> CountApprovedOrPendingRegistrationsAsync(Guid shiftTemplateId, DateTime date);
    Task AddShiftRegistrationAsync(StaffShiftRegistrationEntity registration);
    
    // Working Logs
    Task<bool> HasActiveWorkingLogAsync(Guid staffId, DateTime date);
    Task<StaffWorkingLoggerEntity?> GetActiveWorkingLogAsync(Guid staffId);
    Task AddWorkingLogAsync(StaffWorkingLoggerEntity workingLog);
    
    // Roles & Permissions
    Task<List<string>> GetUserRoleNamesAsync(Guid userId);
    Task<List<Guid>> GetUserRoleIdsAsync(Guid userId);
    Task<List<string>> GetRolePermissionsAsync(IEnumerable<Guid> roleIds);
    Task<bool> UserHasRoleAsync(Guid userId, string roleName);

    // Save & Transactions
    Task SaveChangesAsync();
}
