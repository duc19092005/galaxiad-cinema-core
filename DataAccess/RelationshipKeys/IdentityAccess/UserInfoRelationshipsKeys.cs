using DataAccess.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.RelationshipKeys.IdentityAccess;

public static class UserInfoRelationshipsKeys
{
    public static void AddUserInfoRelationships(ModelBuilder  modelBuilder)
    {
        modelBuilder.Entity<UserInfoEntity>()
            .HasOne(u => u.UserProfileEntity)
            .WithOne(p => p.UserInfoEntity)
            .HasForeignKey<UserProfileEntity>(p => p.UserId);
    }
    
    public static void AddUserInfoKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserInfoEntity>().HasIndex(x => x.RefreshToken).IsUnique();

        modelBuilder.Entity<UserInfoEntity>().HasIndex(x => x.UserEmail).IsUnique();
    }
}

