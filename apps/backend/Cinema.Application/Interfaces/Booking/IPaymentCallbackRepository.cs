using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Entities.Vouchers;

namespace Cinema.Application.Interfaces.Booking;

public interface IPaymentCallbackRepository
{
    Task<OrderInfoEntity?> GetOrderByIdAsync(Guid orderId);
    Task<CustomerProfileEntity?> GetCustomerProfileWithSegmentAsync(Guid userId);
    Task<int> CountOrderDetailsAsync(Guid orderId);
    Task<UserInfoEntity?> FindUserByIdAsync(Guid userId);
    Task<UserVoucherEntity?> GetUserVoucherForUsageAsync(Guid voucherId, Guid userId);
}
