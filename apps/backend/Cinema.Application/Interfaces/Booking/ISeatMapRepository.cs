using Cinema.Application.Dtos.Booking;

namespace Cinema.Application.Interfaces.Booking;

public interface ISeatMapRepository
{
    Task<SeatMapScheduleQueryDto?> GetScheduleForSeatMapAsync(Guid scheduleId);
    Task<List<Guid>> GetOccupiedSeatIdsAsync(Guid scheduleId);
}
