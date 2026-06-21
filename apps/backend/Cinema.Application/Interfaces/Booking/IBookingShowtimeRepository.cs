using Cinema.Domain.Entities.MovieInfos;

namespace Cinema.Application.Interfaces.Booking;

public interface IBookingShowtimeRepository
{
    Task<List<MovieScheduleInfoEntity>> GetAdvancedSearchSchedulesAsync(DateTime startUtc, DateTime endUtc, DateTime nowUtc, Guid? movieId, Guid? cinemaId);
    Task<List<MovieScheduleInfoEntity>> GetCinemaShowtimesAsync(Guid movieId, string city, DateTime startUtc, DateTime endUtc, DateTime nowUtc);
}
