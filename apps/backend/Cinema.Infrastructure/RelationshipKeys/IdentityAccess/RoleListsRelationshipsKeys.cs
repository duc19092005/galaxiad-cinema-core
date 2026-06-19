using Cinema.Domain.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.RelationshipKeys.IdentityAccess;

public static class RoleListsRelationshipsKeys
{
    public static void AddRoleListsRelationships(ModelBuilder modelBuilder)
    {
        
    }

    public static void AddRoleListsKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RoleListInfoEntity>().HasIndex(x => x.RoleName).IsUnique();

        modelBuilder.Entity<PermissionForRoleEntity>()
            .HasKey(x => new { x.PermissionId, x.RoleId });

        modelBuilder.Entity<UserRoleInfoEntity>()
            .HasKey(x => new { x.RoleId, x.UserId });
    }
}

