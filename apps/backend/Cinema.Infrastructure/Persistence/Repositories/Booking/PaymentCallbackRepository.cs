using Cinema.Application.Interfaces.Booking;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Entities.Vouchers;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Repositories;

public class PaymentCallbackRepository : IPaymentCallbackRepository
{
    private readonly CinemaDbContext _dbContext;

    public PaymentCallbackRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<OrderInfoEntity?> GetOrderByIdAsync(Guid orderId)
    {
        return await _dbContext.Set<OrderInfoEntity>()
            .FirstOrDefaultAsync(o => o.OrderId == orderId);
    }

    public async Task<CustomerProfileEntity?> GetCustomerProfileWithSegmentAsync(Guid userId)
    {
        return await _dbContext.Set<CustomerProfileEntity>()
            .Include(cp => cp.UserSegmentsInfoEntity)
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
}
