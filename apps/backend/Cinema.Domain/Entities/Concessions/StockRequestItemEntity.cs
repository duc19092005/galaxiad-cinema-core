using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
// ReSharper disable All

namespace Cinema.Domain.Entities.Concessions;

/// <summary>
/// Chi tiết sản phẩm trong một phiếu yêu cầu nhập hàng F&B.
/// </summary>
public class StockRequestItemEntity
{
    [Key]
    public Guid StockRequestItemId { get; set; }

    [ForeignKey("StockRequestEntity")]
    public Guid StockRequestId { get; set; }

    [ForeignKey("ConcessionProductEntity")]
    public Guid ProductId { get; set; }

    /// <summary>Số lượng rạp yêu cầu xin cấp</summary>
    public int RequestedQuantity { get; set; }

    /// <summary>Số lượng kho tổng duyệt xuất</summary>
    public int ApprovedQuantity { get; set; }

    /// <summary>Số lượng rạp thực nhận được (sau kiểm đếm)</summary>
    public int ReceivedQuantity { get; set; }

    public StockRequestEntity StockRequestEntity { get; set; } = null!;
    public ConcessionProductEntity ConcessionProductEntity { get; set; } = null!;
}
