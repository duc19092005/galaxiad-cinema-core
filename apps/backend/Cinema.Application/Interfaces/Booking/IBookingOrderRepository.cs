using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Entities.Vouchers;

namespace Cinema.Application.Interfaces.Booking;

public interface IBookingOrderRepository
{
    Task<DepartmentEntity?> GetDepartmentBySharedUserIdAsync(Guid userId);
    Task<StaffWorkingLoggerEntity?> GetActiveStaffLoggerAsync(Guid cinemaId);
    Task<UserInfoEntity?> FindUserByEmailAsync(string email);
    Task<MovieScheduleInfoEntity?> GetScheduleByIdAsync(Guid scheduleId);
    Task<List<SeatsInfoEntity>> GetValidSeatsAsync(Guid auditoriumId, List<Guid> seatIds);
    Task<List<Guid>> GetAlreadyBookedSeatsAsync(Guid scheduleId, List<Guid> seatIds);
    Task<List<SeatsInfoEntity>> GetAuditoriumSeatsAsync(Guid auditoriumId);
    Task<List<Guid>> GetOccupiedSeatIdsAsync(Guid scheduleId);
    Task<CustomerProfileEntity?> GetCustomerProfileAsync(Guid userId);
    Task<UserVoucherEntity?> GetUserVoucherAsync(Guid voucherId, Guid userId);
    Task<UserInfoEntity?> FindUserByIdAsync(Guid userId);
    Task AddOrderAsync(OrderInfoEntity order);
    Task AddOrderDetailsRangeAsync(List<OrderDetailsInfo> details);
    Task<OrderInfoEntity?> GetOrderWithDetailsAsync(Guid orderId);
}
