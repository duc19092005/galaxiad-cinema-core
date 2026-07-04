using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Cinema.Domain.Enums;
// ReSharper disable All

namespace Cinema.Domain.Entities.UserInfos;

public class CustomerProfileEntity
{
    [Key]
    public Guid UserId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPoint { get; set; } = 0;

    public MembershipRankEnum MembershipRank { get; set; } = MembershipRankEnum.Standard;

    public UserInfoEntity UserInfoEntity { get; set; } = null!;
}
