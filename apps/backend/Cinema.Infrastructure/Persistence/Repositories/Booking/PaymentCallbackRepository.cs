using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Entities.Vouchers;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Persistence.Repositories.Booking;

public class PaymentCallbackRepository : IPaymentCallbackRepository
{
    private readonly CinemaDbContext _dbContext;
    private readonly ICommonBookingQueries _common;

    public PaymentCallbackRepository(CinemaDbContext dbContext, ICommonBookingQueries common)
    {
        _dbContext = dbContext;
        _common = common;
    }

    public async Task<OrderInfoEntity?> GetOrderByIdAsync(Guid orderId)
    {
        return await _dbContext.Set<OrderInfoEntity>()
            .Include(o => o.OrderDetailsInfo)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);
    }

    public async Task<CustomerProfileEntity?> GetCustomerProfileAsync(Guid userId)
    {
        return await _dbContext.Set<CustomerProfileEntity>()
            .FirstOrDefaultAsync(cp => cp.UserId == userId);
    }

    public async Task<int> CountOrderDetailsAsync(Guid orderId)
    {
        return await _dbContext.Set<OrderDetailsInfo>()
            .CountAsync(od => od.OrderId == orderId);
    }

    public async Task<UserInfoEntity?> FindUserByIdAsync(Guid userId)
    {
        return await _dbContext.Set<UserInfoEntity>()
            .FirstOrDefaultAsync(u => u.UserId == userId);
    }

    public async Task<UserVoucherEntity?> GetUserVoucherForUsageAsync(Guid voucherId, Guid userId)
    {
        return await _dbContext.Set<UserVoucherEntity>()
            .FirstOrDefaultAsync(uv => uv.VoucherId == voucherId && uv.UserId == userId && !uv.IsUsed);
    }

    public async Task AddOrderAsync(OrderInfoEntity order)
    {
        await _dbContext.Set<OrderInfoEntity>().AddAsync(order);
    }
}
