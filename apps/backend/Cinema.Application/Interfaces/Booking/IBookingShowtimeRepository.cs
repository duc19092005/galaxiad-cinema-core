using Cinema.Application.Dtos.Booking;

namespace Cinema.Application.Interfaces.Booking;

public interface IBookingShowtimeRepository
{
    Task<List<ScheduleSearchRowDto>> GetAdvancedSearchSchedulesAsync(DateTime startUtc, DateTime endUtc, DateTime nowUtc, Guid? movieId, Guid? cinemaId);
    Task<List<ScheduleSearchRowDto>> GetCinemaShowtimesAsync(Guid movieId, string city, DateTime startUtc, DateTime endUtc, DateTime nowUtc);
}
