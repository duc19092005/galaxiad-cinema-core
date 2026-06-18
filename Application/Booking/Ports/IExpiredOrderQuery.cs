namespace Application.Booking.Ports;

/// <summary>
/// Cổng đọc phục vụ job bảo trì: tìm các đơn Pending đã quá hạn thanh toán để nhả ghế (B3).
/// </summary>
public interface IExpiredOrderQuery
{
    /// <summary>
    /// Trả về Id các đơn đang Pending có OrderDate &lt; cutoff (đã quá hạn giữ chỗ).
    /// </summary>
    Task<List<Guid>> GetExpiredPendingOrderIdsAsync(
        DateTime cutoff, int maxBatch, CancellationToken cancellationToken = default);
}
