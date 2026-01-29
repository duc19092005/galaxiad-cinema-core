using DataAccess.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.RelationshipKeys.IdentityAccess;

public static class RoleListsRelationshipsKeys
{
    public static void AddRoleListsRelationships(ModelBuilder modelBuilder)
    {
        
    }

    public static void AddRoleListsKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RoleListInfoEntity>().HasIndex(x => x.RoleName).IsUnique();
    }
}

