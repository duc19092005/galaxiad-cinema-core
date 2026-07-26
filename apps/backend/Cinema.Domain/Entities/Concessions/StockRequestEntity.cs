using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
// ReSharper disable All

namespace Cinema.Domain.Entities.Concessions;

/// <summary>
/// Phiếu yêu cầu nhập hàng F&B do TheaterManager tại rạp tạo để xin kho tổng cấp hàng.
/// </summary>
public class StockRequestEntity
{
    [Key]
    public Guid StockRequestId { get; set; }

    /// <summary>Mã phiếu yêu cầu (VD: SR-20260726-001)</summary>
    [Column(TypeName = "varchar(50)")]
    [Required]
    public string RequestCode { get; set; } = string.Empty;

    [ForeignKey("CinemaInfoEntity")]
    public Guid CinemaId { get; set; }

    public StockRequestStatus Status { get; set; } = StockRequestStatus.Pending;

    [ForeignKey("RequestedByUser")]
    public Guid RequestedByUserId { get; set; }

    public Guid? ApprovedByUserId { get; set; }
    public Guid? ShippedByUserId { get; set; }
    public Guid? ReceivedByUserId { get; set; }

    [Column(TypeName = "nvarchar(500)")]
    public string? Note { get; set; }

    [Column(TypeName = "nvarchar(500)")]
    public string? RejectReason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }
    public DateTime? ShippedAt { get; set; }
    public DateTime? ReceivedAt { get; set; }

    public CinemaInfoEntity CinemaInfoEntity { get; set; } = null!;
    public UserInfoEntity RequestedByUser { get; set; } = null!;
    public UserInfoEntity? ApprovedByUser { get; set; }
    public UserInfoEntity? ShippedByUser { get; set; }
    public UserInfoEntity? ReceivedByUser { get; set; }

    public List<StockRequestItemEntity> Items { get; set; } = [];
}
