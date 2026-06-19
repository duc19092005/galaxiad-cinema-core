using System.ComponentModel.DataAnnotations.Schema;
// ReSharper disable All

namespace Cinema.Domain.Entities.UserInfos;

public class PermissionForRoleEntity
{
    [ForeignKey("PermissionEntity")]
    public Guid PermissionId { get; set; }

    [ForeignKey("RoleListInfoEntity")]
    public Guid RoleId { get; set; }

    public PermissionEntity PermissionEntity { get; set; } = null!;
    public RoleListInfoEntity RoleListInfoEntity { get; set; } = null!;
}
