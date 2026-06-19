namespace Cinema.Domain.Enums;

public enum OrderStatusEnum
{
    /// <summary>
    /// Khách đang chọn ghế, chưa thanh toán (giữ chỗ tạm thời)
    /// </summary>
    Pending = 1,

    /// <summary>
    /// Đã thanh toán thành công, vé có hiệu lực
    /// </summary>
    Booked = 2,

    /// <summary>
    /// Đơn hàng bị hủy (do khách chủ động hoặc hết thời gian thanh toán)
    /// </summary>
    Canceled = 3,

    /// <summary>
    /// Đã hoàn tiền cho khách (ví dụ rạp hỏng điều hòa, lỗi kỹ thuật)
    /// </summary>
    Refunded = 4,

    /// <summary>
    /// Khách đã đến rạp và soát vé xong (vé đã sử dụng)
    /// </summary>
    Completed = 5
}
