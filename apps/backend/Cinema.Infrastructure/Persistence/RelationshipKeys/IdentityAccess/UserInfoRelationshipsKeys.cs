using Cinema.Domain.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.RelationshipKeys.IdentityAccess;

public static class UserInfoRelationshipsKeys
{
    public static void AddUserInfoKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserInfoEntity>().HasIndex(x => x.RefreshToken).IsUnique();

        modelBuilder.Entity<UserInfoEntity>().HasIndex(x => x.UserEmail).IsUnique();
    }
}
