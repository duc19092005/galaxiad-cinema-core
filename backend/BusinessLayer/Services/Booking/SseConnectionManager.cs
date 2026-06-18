using System.Collections.Concurrent;

namespace BusinessLayer.Services.Booking;

/// <summary>
/// Service quản lý SSE connections.
/// Cho phép gửi event realtime tới FE khi thanh toán hoàn tất.
/// Hoạt động trên cả Web và Mobile vì SSE là HTTP-based.
/// </summary>
public class SseConnectionManager
{
    // Key = OrderId, Value = TaskCompletionSource để notify khi payment hoàn tất
    private readonly ConcurrentDictionary<Guid, TaskCompletionSource<PaymentStatusEvent>> _connections = new();

    /// <summary>
    /// Đăng ký chờ kết quả thanh toán cho một OrderId
    /// </summary>
    public TaskCompletionSource<PaymentStatusEvent> Register(Guid orderId)
    {
        var tcs = new TaskCompletionSource<PaymentStatusEvent>(TaskCreationOptions.RunContinuationsAsynchronously);
        _connections[orderId] = tcs;
        return tcs;
    }

    /// <summary>
    /// Gửi kết quả thanh toán cho OrderId (được gọi từ VNPay callback)
    /// </summary>
    public bool NotifyPaymentResult(Guid orderId, PaymentStatusEvent status)
    {
        if (_connections.TryRemove(orderId, out var tcs))
        {
            tcs.TrySetResult(status);
            return true;
        }
        return false;
    }

    /// <summary>
    /// Hủy đăng ký khi client disconnect
    /// </summary>
    public void Unregister(Guid orderId)
    {
        if (_connections.TryRemove(orderId, out var tcs))
        {
            tcs.TrySetCanceled();
        }
    }
}

public class PaymentStatusEvent
{
    public Guid OrderId { get; set; }
    public string Status { get; set; } = string.Empty; // "success" | "failed" | "cancelled"
    public string Message { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public decimal? TotalPrice { get; set; }
}
