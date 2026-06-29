using Cinema.Application.Dtos.Shifts;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Application.Interfaces.Facilities;

public interface IStaffShiftRepository
{
    Task<StaffProfileEntity?> GetStaffProfileByUserIdAsync(Guid userId);
    Task<List<CinemaShiftTemplateEntity>> GetActiveShiftTemplatesForCinemaAsync(Guid cinemaId);
    Task<int> CountApprovedOrPendingRegistrationsAsync(Guid shiftTemplateId, DateTime date);
    Task<int> CountApprovedOrPendingRegistrationsForScheduleAsync(Guid shiftScheduleId);
    Task<List<CinemaShiftScheduleEntity>> GetActiveShiftSchedulesForCinemaAndDepartmentAsync(Guid cinemaId, Guid departmentId, DateTime date);
    Task<CinemaShiftScheduleEntity?> GetShiftScheduleByIdAsync(Guid shiftScheduleId);
    Task<List<ResStaffShiftRegistrationDto>> GetMyRegistrationsAsync(Guid staffId);
    Task<StaffShiftRegistrationEntity?> GetRegistrationByIdAndStaffAsync(Guid registrationId, Guid staffId);
    Task RemoveRegistrationAsync(StaffShiftRegistrationEntity registration);
    Task RemoveRegistrationsAsync(List<StaffShiftRegistrationEntity> registrations);
    Task<List<StaffShiftRegistrationEntity>> GetPendingRegistrationsByIdsAsync(List<Guid> ids, Guid staffId);
    Task<List<StaffWorkingLoggerEntity>> GetMyWorkingHistoryAsync(Guid staffId);
    Task<List<OrderInfoEntity>> GetTicketSalesForWorkingLogsAsync(Guid staffId, List<StaffWorkingLoggerEntity> logs);
    Task<List<ResPayrollDto>> GetMyPayrollAsync(Guid staffId);
}
