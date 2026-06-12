using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
// ReSharper disable All

namespace DataAccess.Entities.UserInfos;

public class CustomerProfileEntity
{
    [Key]
    public Guid UserId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPoint { get; set; } = 0;

    public UserInfoEntity UserInfoEntity { get; set; } = null!;
}
