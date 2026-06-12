using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
// ReSharper disable All

namespace DataAccess.Entities.UserInfos;

[PrimaryKey(nameof(PermissionId), nameof(RoleId))]
public class PermissionForRoleEntity
{
    [ForeignKey("PermissionEntity")]
    public Guid PermissionId { get; set; }

    [ForeignKey("RoleListInfoEntity")]
    public Guid RoleId { get; set; }

    public PermissionEntity PermissionEntity { get; set; } = null!;
    public RoleListInfoEntity RoleListInfoEntity { get; set; } = null!;
}
