namespace Application.Booking.Ports;

/// <summary>
/// Thông tin lịch chiếu cần để kiểm tra & định giá khi đặt vé.
/// </summary>
public record ScheduleBookingInfo(
    Guid ScheduleId,
    bool MovieIsActive,
    DateTime StartTime,
    Guid AuditoriumId,
    Guid? CinemaId,
    Guid MovieFormatId,
    decimal BasePrice);

/// <summary>Phụ thu theo phân khúc khách hàng cho 1 rạp + định dạng.</summary>
public record SurchargeInfo(Guid UserSegmentId, decimal SurchargePercent);

/// <summary>Thông tin khách hàng lấy từ tài khoản đăng nhập.</summary>
public record CustomerInfo(string? CustomerName, string? CustomerEmail);

/// <summary>
/// Cổng đọc phục vụ luồng đặt vé (kiểm tra ghế/suất/phân khúc, lấy phụ thu, thông tin user).
/// </summary>
public interface IBookingQueryRepository
{
    Task<ScheduleBookingInfo?> GetScheduleForBookingAsync(
        Guid scheduleId, CancellationToken cancellationToken = default);

    Task<int> CountValidSeatsAsync(
        Guid auditoriumId, IReadOnlyCollection<Guid> seatIds, CancellationToken cancellationToken = default);

    Task<int> CountValidSegmentsAsync(
        IReadOnlyCollection<Guid> segmentIds, CancellationToken cancellationToken = default);

    /// <summary>Trả về các ghế đã bị giữ (Pending) hoặc đã bán (Booked) trong số ghế truyền vào.</summary>
    Task<List<Guid>> GetOccupiedSeatIdsAsync(
        Guid scheduleId, IReadOnlyCollection<Guid> seatIds, CancellationToken cancellationToken = default);

    Task<List<SurchargeInfo>> GetSurchargesAsync(
        Guid cinemaId, Guid formatId, CancellationToken cancellationToken = default);

    Task<CustomerInfo?> GetUserCustomerInfoAsync(
        Guid userId, CancellationToken cancellationToken = default);
}
