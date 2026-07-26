using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
// ReSharper disable All

namespace Cinema.Domain.Entities.Concessions;

/// <summary>
/// Sản phẩm đồ ăn thức uống (bắp nước) bán kèm tại rạp.
/// Mỗi sản phẩm thuộc về một rạp cụ thể, cho phép mỗi rạp có menu và giá riêng.
/// </summary>
public class ConcessionProductEntity : BaseManagementStatus<UserInfoEntity>
{
    [Key]
    public Guid ProductId { get; set; }

    [ForeignKey("CinemaInfoEntity")]
    public Guid CinemaId { get; set; }

    [Column(TypeName = "nvarchar(200)")]
    [Required]
    public string ProductName { get; set; } = string.Empty;

    /// <summary>Mã sản phẩm, duy nhất trong phạm vi một rạp</summary>
    [Column(TypeName = "varchar(50)")]
    [Required]
    public string Sku { get; set; } = string.Empty;

    public ConcessionCategory Category { get; set; }

    /// <summary>Giá bán cho khách</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    /// <summary>Giá nhập, dùng để tính lãi gộp trong báo cáo</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal CostPrice { get; set; }

    public ConcessionUnit Unit { get; set; } = ConcessionUnit.Piece;

    [Column(TypeName = "nvarchar(500)")]
    public string? ImageUrl { get; set; }

    [Column(TypeName = "nvarchar(1000)")]
    public string? Description { get; set; }

    /// <summary>Cho khách đặt online kèm vé hay chỉ bán tại quầy</summary>
    public bool IsAvailableOnline { get; set; } = true;

    /// <summary>Sản phẩm nổi bật để ưu tiên hiển thị cho khách hàng</summary>
    public bool IsHot { get; set; } = false;

    /// <summary>true = combo, tồn kho được tính theo các ComboItem thành phần</summary>
    public bool IsCombo { get; set; } = false;

    /// <summary>Ngưỡng cảnh báo sắp hết hàng</summary>
    public int LowStockThreshold { get; set; } = 10;

    public CinemaInfoEntity CinemaInfoEntity { get; set; } = null!;

    public ConcessionInventoryEntity? Inventory { get; set; }

    /// <summary>Các thành phần con nếu sản phẩm này là combo</summary>
    public List<ConcessionComboItemEntity> ComboItems { get; set; } = [];

    public List<InventoryTransactionEntity> InventoryTransactions { get; set; } = [];
}
