using Cinema.Domain.Entities.MovieInfos;

namespace Cinema.Application.Interfaces.Booking;

public interface ISeatMapRepository
{
    Task<MovieScheduleInfoEntity?> GetScheduleForSeatMapAsync(Guid scheduleId);
    Task<List<Guid>> GetOccupiedSeatIdsAsync(Guid scheduleId);
}
