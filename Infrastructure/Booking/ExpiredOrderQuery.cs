using Application.Booking.Ports;
using DataAccess;
using DataAccess.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;
using Shared.Enums;

namespace Infrastructure.Booking;

/// <summary>
/// Hiện thực cổng tìm đơn Pending quá hạn bằng EF Core (phục vụ fix B3).
/// </summary>
public class ExpiredOrderQuery : IExpiredOrderQuery
{
    private readonly CinemaDbContext _dbContext;

    public ExpiredOrderQuery(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Guid>> GetExpiredPendingOrderIdsAsync(
        DateTime cutoff, int maxBatch, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Set<OrderInfoEntity>()
            .Where(o => o.OrderStatus == OrderStatusEnum.Pending && o.OrderDate < cutoff)
            .OrderBy(o => o.OrderDate)
            .Select(o => o.OrderId)
            .Take(maxBatch)
            .ToListAsync(cancellationToken);
    }
}
