using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Enums;
// ReSharper disable All

namespace Cinema.Domain.Entities.Concessions;

/// <summary>
/// Báo cáo hàng hỏng / hao hụt do TheaterManager gửi cho WarehouseManager duyệt trừ tồn.
/// </summary>
public class WasteReportEntity
{
    [Key]
    public Guid WasteReportId { get; set; }

    [ForeignKey("CinemaInfoEntity")]
    public Guid CinemaId { get; set; }

    [ForeignKey("ConcessionProductEntity")]
    public Guid ProductId { get; set; }

    /// <summary>Số lượng xin báo hủy</summary>
    public int Quantity { get; set; }

    [Column(TypeName = "nvarchar(500)")]
    [Required]
    public string Reason { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(500)")]
    public string? ProofImageUrl { get; set; }

    public WasteReportStatus Status { get; set; } = WasteReportStatus.Pending;

    [ForeignKey("ReportedByUser")]
    public Guid ReportedByUserId { get; set; }

    public Guid? ReviewedByUserId { get; set; }

    [Column(TypeName = "nvarchar(500)")]
    public string? ReviewNote { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }

    public CinemaInfoEntity CinemaInfoEntity { get; set; } = null!;
    public ConcessionProductEntity ConcessionProductEntity { get; set; } = null!;
    public UserInfoEntity ReportedByUser { get; set; } = null!;
    public UserInfoEntity? ReviewedByUser { get; set; }
}
