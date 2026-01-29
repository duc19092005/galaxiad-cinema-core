using DataAccess.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.RelationshipKeys.IdentityAccess;

public static class UserProfileRelationshipsKeys
{
    public static void AddUserProfileRelationships(ModelBuilder modelBuilder)
    {
        
    }

    public static void AddUserProfileKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserProfileEntity>().HasIndex(x => x.PhoneNumber)
            .IsUnique();

        modelBuilder.Entity<UserProfileEntity>().HasIndex(x => x.IdentityCode)
            .IsUnique();
    }
}

