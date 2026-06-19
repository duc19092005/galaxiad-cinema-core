using Cinema.Domain.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.RelationshipKeys.IdentityAccess;

public static class UserSegmentsInfoRelationshipsKeys
{
    public static void AddUserSegmentsInfoRelationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CustomerProfileEntity>()
            .HasOne(x => x.UserSegmentsInfoEntity)
            .WithMany()
            .HasForeignKey(x => x.UserSegmentId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public static void AddUserSegmentsInfoKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserSegmentsInfoEntity>().HasKey(x => x.UserSegmentId);
        modelBuilder.Entity<UserSegmentsInfoEntity>().HasIndex(x => x.UserSegmentName).IsUnique();
        modelBuilder.Entity<UserSegmentsInfoEntity>().HasIndex(x => x.UserSegmentDescription).IsUnique();
    }
}

