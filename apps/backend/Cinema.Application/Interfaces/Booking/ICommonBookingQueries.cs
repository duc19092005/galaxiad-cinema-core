using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Application.Interfaces.Booking;

public interface ICommonBookingQueries
{
    Task<List<Guid>> GetOccupiedSeatIdsAsync(Guid scheduleId, Guid? excludeGroupSessionId = null);
    Task<MovieScheduleInfoEntity?> GetScheduleByIdAsync(Guid scheduleId);
    Task<List<SeatsInfoEntity>> GetValidSeatsAsync(Guid auditoriumId, List<Guid> seatIds);
    Task<UserInfoEntity?> FindUserByIdAsync(Guid userId);
}
