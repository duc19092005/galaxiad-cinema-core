using Shared.Enums;

namespace Domain.Booking;

/// <summary>
/// Aggregate root cho một đơn đặt vé. Đóng gói invariants và chuyển trạng thái
/// (Pending → Booked / Canceled) thay vì để logic rải rác trong service.
/// </summary>
public class Order
{
    private readonly List<OrderDetail> _details = new();

    public Guid OrderId { get; private set; }
    public Guid? UserId { get; private set; }
    public Guid? StaffId { get; private set; }
    public OrderStatusEnum OrderStatus { get; private set; }
    public PaymentMethodEnum PaymentMethod { get; private set; }
    public decimal TotalPrice { get; private set; }
    public DateTime OrderDate { get; private set; }
    public int TotalQuantity { get; private set; }
    public string? CustomerName { get; private set; }
    public string? CustomerAddress { get; private set; }
    public string? CustomerEmail { get; private set; }
    public string? VnPayTransactionId { get; private set; }

    public IReadOnlyList<OrderDetail> Details => _details.AsReadOnly();

    private Order() { }

    /// <summary>
    /// Tạo đơn mới ở trạng thái Pending. Tính tổng tiền/số lượng từ chi tiết.
    /// </summary>
    public static Order CreatePending(
        Guid? userId,
        PaymentMethodEnum paymentMethod,
        DateTime orderDate,
        string? customerName,
        string? customerEmail,
        string? customerAddress,
        IEnumerable<OrderDetail> details)
    {
        var detailList = details?.ToList() ?? new List<OrderDetail>();
        if (detailList.Count == 0)
        {
            throw new DomainException("Đơn hàng phải có ít nhất một ghế.");
        }

        var order = new Order
        {
            OrderId = Guid.NewGuid(),
            UserId = userId,
            OrderStatus = OrderStatusEnum.Pending,
            PaymentMethod = paymentMethod,
            OrderDate = orderDate,
            CustomerName = customerName,
            CustomerEmail = customerEmail,
            CustomerAddress = customerAddress
        };

        foreach (var d in detailList)
        {
            d.AttachToOrder(order.OrderId);
            order._details.Add(d);
        }

        order.TotalQuantity = order._details.Count;
        order.TotalPrice = order._details.Sum(d => d.PriceEach);
        return order;
    }

    /// <summary>
    /// Rehydrate từ persistence (Infrastructure dùng để dựng lại aggregate từ EF entity).
    /// </summary>
    public static Order Rehydrate(
        Guid orderId,
        Guid? userId,
        Guid? staffId,
        OrderStatusEnum status,
        PaymentMethodEnum paymentMethod,
        decimal totalPrice,
        DateTime orderDate,
        int totalQuantity,
        string? customerName,
        string? customerEmail,
        string? customerAddress,
        string? vnPayTransactionId,
        IEnumerable<OrderDetail>? details = null)
    {
        var order = new Order
        {
            OrderId = orderId,
            UserId = userId,
            StaffId = staffId,
            OrderStatus = status,
            PaymentMethod = paymentMethod,
            TotalPrice = totalPrice,
            OrderDate = orderDate,
            TotalQuantity = totalQuantity,
            CustomerName = customerName,
            CustomerEmail = customerEmail,
            CustomerAddress = customerAddress,
            VnPayTransactionId = vnPayTransactionId
        };
        if (details != null)
        {
            order._details.AddRange(details);
        }
        return order;
    }

    public bool IsPending => OrderStatus == OrderStatusEnum.Pending;

    /// <summary>
    /// Xác nhận thanh toán thành công. Idempotent: chỉ chuyển Pending → Booked đúng một lần.
    /// Trả về true nếu thực sự chuyển trạng thái lần này.
    /// </summary>
    public bool ConfirmPayment(string? transactionId)
    {
        if (OrderStatus != OrderStatusEnum.Pending)
        {
            return false;
        }
        OrderStatus = OrderStatusEnum.Booked;
        VnPayTransactionId = transactionId;
        return true;
    }

    /// <summary>
    /// Huỷ đơn (thanh toán thất bại hoặc hết hạn). Chỉ huỷ được khi đang Pending.
    /// </summary>
    public bool Cancel()
    {
        if (OrderStatus != OrderStatusEnum.Pending)
        {
            return false;
        }
        OrderStatus = OrderStatusEnum.Canceled;
        return true;
    }
}
