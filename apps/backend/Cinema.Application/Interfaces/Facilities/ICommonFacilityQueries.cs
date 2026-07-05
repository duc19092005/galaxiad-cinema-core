using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;

namespace Cinema.Application.Interfaces.Facilities;

public interface ICommonFacilityQueries
{
    Task<List<MovieScheduleInfoEntity>> GetActiveSchedulesByAuditoriumIdAsync(Guid auditoriumId);
    Task CancelPendingOrdersForScheduleAsync(Guid scheduleId);
    Task<List<CinemaShiftScheduleEntity>> GetActiveShiftSchedulesForCinemaAndDepartmentAsync(Guid cinemaId, Guid departmentId, DateTime date);
}
