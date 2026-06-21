using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Application.Interfaces.Booking;

public interface IUserBookingRepository
{
    Task<List<OrderInfoEntity>> GetUserBookingHistoryAsync(Guid userId);
    Task<UserInfoEntity?> GetUserAccountInfoAsync(Guid userId);
}
