using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
// ReSharper disable All

namespace BusinessLayer.Entities.UserInfos;

public class CustomerProfileEntity
{
    [Key]
    public Guid UserId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPoint { get; set; } = 0;

    public Guid UserSegmentId { get; set; }

    public UserSegmentsInfoEntity UserSegmentsInfoEntity { get; set; } = null!;

    public UserInfoEntity UserInfoEntity { get; set; } = null!;
}
