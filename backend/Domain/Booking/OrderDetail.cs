namespace Domain.Booking;

/// <summary>
/// Chi tiết một ghế trong đơn đặt vé.
/// </summary>
public class OrderDetail
{
    public Guid OrderId { get; private set; }
    public Guid SeatId { get; private set; }
    public Guid MovieScheduleId { get; private set; }
    public Guid UserSegmentId { get; private set; }
    public decimal PriceEach { get; private set; }

    private OrderDetail() { }

    public OrderDetail(Guid seatId, Guid movieScheduleId, Guid userSegmentId, decimal priceEach)
    {
        if (priceEach < 0)
        {
            throw new DomainException("Giá vé không được âm.");
        }
        SeatId = seatId;
        MovieScheduleId = movieScheduleId;
        UserSegmentId = userSegmentId;
        PriceEach = priceEach;
    }

    public static OrderDetail Rehydrate(
        Guid orderId, Guid seatId, Guid movieScheduleId, Guid userSegmentId, decimal priceEach)
    {
        return new OrderDetail
        {
            OrderId = orderId,
            SeatId = seatId,
            MovieScheduleId = movieScheduleId,
            UserSegmentId = userSegmentId,
            PriceEach = priceEach
        };
    }

    internal void AttachToOrder(Guid orderId) => OrderId = orderId;
}
