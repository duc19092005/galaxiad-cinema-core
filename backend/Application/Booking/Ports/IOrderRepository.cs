using Domain.Booking;

namespace Application.Booking.Ports;

/// <summary>
/// Cổng ghi cho aggregate Order. Infrastructure implement bằng EF Core.
/// </summary>
public interface IOrderRepository
{
    Task AddAsync(Order order, CancellationToken cancellationToken = default);

    Task<Order?> GetByIdAsync(Guid orderId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Áp thay đổi trạng thái của aggregate (đã lấy qua GetByIdAsync) trở lại lớp lưu trữ.
    /// Phải gọi trước khi commit qua IUnitOfWork.SaveChangesAsync.
    /// </summary>
    Task UpdateAsync(Order order, CancellationToken cancellationToken = default);
}
