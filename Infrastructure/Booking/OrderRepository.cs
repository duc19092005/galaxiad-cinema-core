using Application.Booking.Ports;
using DataAccess;
using DataAccess.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;
using DomainOrder = Domain.Booking.Order;
using DomainOrderDetail = Domain.Booking.OrderDetail;

namespace Infrastructure.Booking;

/// <summary>
/// Repository ghi cho aggregate Order. Ánh xạ Domain Order ↔ EF OrderInfoEntity/OrderDetailsInfo.
/// </summary>
public class OrderRepository : IOrderRepository
{
    private readonly CinemaDbContext _dbContext;

    public OrderRepository(CinemaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(DomainOrder order, CancellationToken cancellationToken = default)
    {
        var orderEntity = new OrderInfoEntity
        {
            OrderId = order.OrderId,
            UserId = order.UserId,
            StaffId = order.StaffId,
            OrderStatus = order.OrderStatus,
            PaymentMethod = order.PaymentMethod,
            TotalPrice = order.TotalPrice,
            OrderDate = order.OrderDate,
            TotalQuantity = order.TotalQuantity,
            CustomerName = order.CustomerName,
            CustomerEmail = order.CustomerEmail,
            CustomerAddress = order.CustomerAddress,
            VnPayTransactionId = order.VnPayTransactionId
        };

        var details = order.Details.Select(d => new OrderDetailsInfo
        {
            OrderId = order.OrderId,
            SeatId = d.SeatId,
            MovieScheduleId = d.MovieScheduleId,
            UserSegmentId = d.UserSegmentId,
            PriceEach = d.PriceEach
        }).ToList();

        await _dbContext.Set<OrderInfoEntity>().AddAsync(orderEntity, cancellationToken);
        await _dbContext.Set<OrderDetailsInfo>().AddRangeAsync(details, cancellationToken);
    }

    public async Task<DomainOrder?> GetByIdAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Set<OrderInfoEntity>()
            .Include(o => o.OrderDetailsInfo)
            .FirstOrDefaultAsync(o => o.OrderId == orderId, cancellationToken);

        if (entity == null)
        {
            return null;
        }

        var details = (entity.OrderDetailsInfo ?? new List<OrderDetailsInfo>())
            .Select(d => DomainOrderDetail.Rehydrate(
                d.OrderId, d.SeatId, d.MovieScheduleId, d.UserSegmentId, d.PriceEach));

        return DomainOrder.Rehydrate(
            entity.OrderId,
            entity.UserId,
            entity.StaffId,
            entity.OrderStatus,
            entity.PaymentMethod,
            entity.TotalPrice,
            entity.OrderDate,
            entity.TotalQuantity,
            entity.CustomerName,
            entity.CustomerEmail,
            entity.CustomerAddress,
            entity.VnPayTransactionId,
            details);
    }

    public async Task UpdateAsync(DomainOrder order, CancellationToken cancellationToken = default)
    {
        // Lấy entity đang được tracking (hoặc nạp lại), rồi áp các trường có thể đổi trạng thái.
        var entity = await _dbContext.Set<OrderInfoEntity>()
            .FirstOrDefaultAsync(o => o.OrderId == order.OrderId, cancellationToken);

        if (entity == null)
        {
            return;
        }

        entity.OrderStatus = order.OrderStatus;
        entity.VnPayTransactionId = order.VnPayTransactionId;
    }
}
