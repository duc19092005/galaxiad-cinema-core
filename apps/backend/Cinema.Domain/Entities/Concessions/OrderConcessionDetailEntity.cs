using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
// ReSharper disable All

namespace Cinema.Domain.Entities.Concessions;

/// <summary>
/// Dòng chi tiết đồ ăn thức uống của một đơn hàng.
///
/// Đây là bảng riêng, không dùng chung với OrderDetailsInfo vì bảng đó gắn chặt
/// vào ghế và suất chiếu (khóa tổ hợp OrderId + SeatId + MovieScheduleId),
/// chỉ phù hợp cho vé.
/// </summary>
public class OrderConcessionDetailEntity
{
    [Key]
    public Guid OrderConcessionDetailId { get; set; }

    [ForeignKey("OrderInfoEntity")]
    public Guid OrderId { get; set; }

    public Guid ProductId { get; set; }

    public int Quantity { get; set; }

    /// <summary>Giá tại thời điểm mua, giữ nguyên kể cả sau này sản phẩm đổi giá</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPriceSnapshot { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal LineTotal { get; set; }

    /// <summary>Tên sản phẩm tại thời điểm mua, để hóa đơn cũ vẫn đọc được đúng</summary>
    [Column(TypeName = "nvarchar(200)")]
    public string ProductNameSnapshot { get; set; } = string.Empty;

    /// <summary>
    /// Trạng thái tồn kho của dòng này trong vòng đời đơn hàng.
    ///
    /// Dùng một enum thay vì hai cờ boolean riêng lẻ, vì hai boolean cho phép tồn tại
    /// tổ hợp vô nghĩa (vừa đã trừ kho vừa đã nhả kho). Một cột trạng thái khiến
    /// những tổ hợp đó không thể biểu diễn được, và khi tồn kho lệch thì chỉ cần đọc
    /// một cột là biết dòng đang ở đâu.
    ///
    /// Cổng thanh toán có thể gọi callback nhiều lần và job hủy đơn có thể chạy trùng,
    /// nên mọi bước chuyển đều kiểm tra trạng thái hiện tại trước khi ghi.
    /// </summary>
    public ConcessionStockState StockState { get; set; } = ConcessionStockState.Reserved;

    public OrderInfoEntity OrderInfoEntity { get; set; } = null!;

    public ConcessionProductEntity ConcessionProductEntity { get; set; } = null!;
}
