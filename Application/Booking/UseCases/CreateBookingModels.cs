namespace Application.Booking.UseCases;

/// <summary>Lệnh tạo đơn đặt vé (input thuần, không phụ thuộc web/EF).</summary>
public record CreateBookingCommand(
    Guid ScheduleId,
    IReadOnlyList<SeatSelection> SeatSelections,
    string IpAddress,
    string? CustomerName,
    string? CustomerEmail,
    string? CustomerAddress);

public record SeatSelection(Guid SeatId, Guid UserSegmentId);

/// <summary>Kết quả tạo đơn: id đơn, URL thanh toán, tổng tiền/số lượng.</summary>
public record CreateBookingResult(
    Guid OrderId,
    string PaymentUrl,
    decimal TotalPrice,
    int TotalQuantity,
    DateTime OrderDate);
