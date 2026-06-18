using BusinessLayer.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.RelationshipKeys.IdentityAccess;

public static class UserInfoRelationshipsKeys
{
    public static void AddUserInfoKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserInfoEntity>().HasIndex(x => x.RefreshToken).IsUnique();

        modelBuilder.Entity<UserInfoEntity>().HasIndex(x => x.UserEmail).IsUnique();
    }
}
