using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
// ReSharper disable All

namespace BusinessLayer.Entities.UserInfos;

public class PermissionEntity
{
    [Key]
    public Guid PermissionId { get; set; }

    [Required]
    [Column(TypeName = "nvarchar(100)")]
    public string PermissionInfo { get; set; } = string.Empty;

    public List<PermissionForRoleEntity> PermissionForRoleEntities { get; set; } = [];
}
