using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Shifts;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Application.Interfaces.Facilities;

public interface IShiftManagerRepository
{
    // Shift Templates
    Task<bool> IsManagerOfCinemaAsync(Guid cinemaId, Guid userId);
    Task AddShiftTemplateAsync(CinemaShiftTemplateEntity template);
    Task<List<ResShiftTemplateDto>> GetShiftTemplatesAsync(Guid cinemaId);

    // Shift Registrations
    Task<List<ResStaffShiftRegistrationDto>> GetShiftRegistrationsAsync(Guid cinemaId, string? status);
    Task<StaffShiftRegistrationEntity?> GetRegistrationByIdWithTemplateAsync(Guid registrationId);
    Task<int> CountApprovedRegistrationsAsync(Guid shiftTemplateId, DateTime date);
    Task<CinemaShiftTemplateEntity?> GetShiftTemplateByIdAsync(Guid shiftTemplateId);
    Task AddShiftRegistrationAsync(StaffShiftRegistrationEntity registration);
    Task<List<StaffShiftRegistrationEntity>> GetActiveRegistrationsForStaffAndDateAsync(Guid staffId, DateTime date);

    // Staff Profiles
    Task<List<ResStaffProfileDto>> GetStaffProfilesAsync(Guid cinemaId);
    Task<StaffProfileEntity?> GetStaffProfileAsync(Guid userId);
    Task<StaffProfileEntity?> GetStaffProfileWithUserAsync(Guid userId);
    Task UpdateStaffProfileAsync(StaffProfileEntity profile, ReqUpdateStaffProfileDto dto);

    // Payroll
    Task<List<ResPayrollDto>> GetStaffPayrollAsync(Guid staffId);
    Task<List<ResPayrollDto>> GetCinemaPayrollAsync(Guid cinemaId);
    Task<List<StaffWorkingLoggerEntity>> GetUncalculatedWorkingLogsAsync(Guid staffId, DateTime upToDate);
    Task AddSalaryTotalLogAsync(StaffSalaryTotalLoggerEntity payroll);
    Task<StaffSalaryTotalLoggerEntity?> GetSalaryTotalLogByIdAsync(Guid payrollId);

    // Auth Helpers
    Task<bool> UserHasRoleAsync(Guid userId, string roleName);
}
