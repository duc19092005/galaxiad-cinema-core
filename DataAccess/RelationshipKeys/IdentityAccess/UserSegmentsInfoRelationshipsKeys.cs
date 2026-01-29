using DataAccess.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.RelationshipKeys.IdentityAccess;

public static class UserSegmentsInfoRelationshipsKeys
{
    public static void AddUserSegmentsInfoRelationships(ModelBuilder modelBuilder)
    {
        
    }

    public static void AddUserSegmentsInfoKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserSegmentsInfoEntity>().HasKey(x => x.UserSegmentId);
        modelBuilder.Entity<UserSegmentsInfoEntity>().HasIndex(x => x.UserSegmentName).IsUnique();
        modelBuilder.Entity<UserSegmentsInfoEntity>().HasIndex(x => x.UserSegmentDescription).IsUnique();
    }
}

