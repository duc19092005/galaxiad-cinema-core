namespace Cinema.Application.Interfaces.Booking;

public interface IBookingBusinessRuleService
{
    Task<bool> HasBookedBookingForMovieAsync(Guid movieId);

    Task<bool> HasBookedBookingForScheduleAsync(Guid scheduleId);

    Task<bool> HasPendingOrdersForScheduleAsync(Guid scheduleId);

    Task<bool> HasBookedBookingForCinemaAsync(Guid cinemaId);

    Task<bool> HasBookedBookingForAuditoriumAsync(Guid auditoriumId);

    Task<bool> HasAnyBookingForAuditoriumSeatsAsync(Guid auditoriumId);

    Task<int> GetBookedBookingCountForScheduleAsync(Guid scheduleId);

    Task<int> MarkPendingOrdersForScheduleCanceledAsync(Guid scheduleId);

    Task<int> MarkStalePendingOrdersCanceledAsync(int expireAfterMinutes = 15);
}
