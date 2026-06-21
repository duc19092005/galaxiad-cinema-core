using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Application.Interfaces.Booking;

public interface IBookingPricingRepository
{
    Task<MovieScheduleInfoEntity?> GetScheduleForPricingAsync(Guid scheduleId);
    Task<List<UserSegmentsInfoEntity>> GetSegmentsAsync(bool hasHighRole);
    Task<List<CinemaSurchargeInfosEntity>> GetCinemaSurchargesAsync(Guid cinemaId, Guid formatId);
}
