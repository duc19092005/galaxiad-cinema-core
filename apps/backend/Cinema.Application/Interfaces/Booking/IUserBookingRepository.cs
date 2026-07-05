using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Dtos.Booking;

namespace Cinema.Application.Interfaces.Booking;

public interface IUserBookingRepository
{
    Task<List<ResUserBookingHistoryDto>> GetUserBookingHistoryDtosAsync(Guid userId, string userEmail, DateTime nowUtc);
    Task<UserInfoEntity?> GetUserAccountInfoAsync(Guid userId);
    Task<ResChatbotBookingStatusDto?> GetOrderByBookingCodeAsync(string bookingCode);
}
