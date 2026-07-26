using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Enums;
// ReSharper disable All

namespace Cinema.Domain.Entities.Concessions;

/// <summary>
/// Sổ cái ghi lại mọi biến động tồn kho. Mỗi lần nhập, bán, giữ hàng, hủy hàng
/// hay kiểm kê đều sinh một dòng, kèm ảnh chụp tồn kho ngay sau giao dịch.
/// Nhờ vậy có thể truy vết lịch sử và đối chiếu khi tồn kho lệch.
/// </summary>
public class InventoryTransactionEntity
{
    [Key]
    public Guid TransactionId { get; set; }

    public Guid ProductId { get; set; }

    [ForeignKey("CinemaInfoEntity")]
    public Guid CinemaId { get; set; }

    public InventoryTransactionType TransactionType { get; set; }

    /// <summary>Số lượng thay đổi: dương là nhập vào, âm là xuất ra</summary>
    public int QuantityChange { get; set; }

    /// <summary>Tồn thực tế ngay sau giao dịch</summary>
    public int QuantityOnHandAfter { get; set; }

    /// <summary>Số lượng đang giữ ngay sau giao dịch</summary>
    public int QuantityReservedAfter { get; set; }

    /// <summary>Đơn hàng liên quan nếu là giao dịch bán hoặc giữ hàng</summary>
    public Guid? OrderId { get; set; }

    /// <summary>Người thực hiện. Null nếu do job hệ thống tự chạy</summary>
    public Guid? PerformedByUserId { get; set; }

    [Column(TypeName = "nvarchar(500)")]
    public string? Note { get; set; }

    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;

    public ConcessionProductEntity ConcessionProductEntity { get; set; } = null!;

    public CinemaInfoEntity CinemaInfoEntity { get; set; } = null!;
}
