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
    Task SaveChangesAsync();

    // Shift Registrations
    Task<List<ResStaffShiftRegistrationDto>> GetShiftRegistrationsAsync(Guid cinemaId, string? status);

    // Staff Profiles
    Task<List<ResStaffProfileDto>> GetStaffProfilesAsync(Guid cinemaId);
    Task<StaffProfileEntity?> GetStaffProfileAsync(Guid userId);
    Task UpdateStaffProfileAsync(StaffProfileEntity profile, ReqUpdateStaffProfileDto dto);

    // Payroll
    Task<List<ResPayrollDto>> GetStaffPayrollAsync(Guid staffId);
    Task<List<ResPayrollDto>> GetCinemaPayrollAsync(Guid cinemaId);
}
