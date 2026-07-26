using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
// ReSharper disable All

namespace Cinema.Domain.Entities.Concessions;

/// <summary>
/// Ảnh chụp tồn kho hiện tại của một sản phẩm (quan hệ 1-1 với sản phẩm).
///
/// Tách QuantityOnHand và QuantityReserved để phục vụ cơ chế giữ hàng 3 pha:
/// đơn đặt online ở trạng thái Pending chỉ giữ hàng (Reserved), chỉ khi thanh toán
/// thành công mới trừ tồn thực (OnHand). Nhờ vậy khách bỏ đơn không làm thất thoát kho,
/// mà cũng không để hai khách mua trùng cùng một món cuối cùng.
/// </summary>
public class ConcessionInventoryEntity
{
    /// <summary>Vừa là khóa chính vừa là khóa ngoại tới sản phẩm</summary>
    [Key]
    public Guid ProductId { get; set; }

    /// <summary>Tồn thực tế đang có trong kho</summary>
    public int QuantityOnHand { get; set; }

    /// <summary>Số lượng đang bị giữ cho các đơn chưa thanh toán</summary>
    public int QuantityReserved { get; set; }

    /// <summary>Số lượng thực sự còn có thể bán</summary>
    [NotMapped]
    public int AvailableToSell => QuantityOnHand - QuantityReserved;

    public DateTime? LastRestockedAt { get; set; }

    public DateTime? LastCountedAt { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Optimistic concurrency: chặn hai giao dịch ghi đè lẫn nhau</summary>
    [Timestamp]
    public byte[] RowVersion { get; set; } = [];

    public ConcessionProductEntity ConcessionProductEntity { get; set; } = null!;
}
