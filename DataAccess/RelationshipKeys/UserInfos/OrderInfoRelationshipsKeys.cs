using DataAccess.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.RelationshipKeys.UserInfos;

public static class OrderInfoRelationshipsKeys
{
    public static void AddOrderInfoRelationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OrderInfoEntity>()
            .HasOne(x => x.UserInfoEntity)
            .WithMany(x => x.OrderInfoEntity)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<OrderInfoEntity>()
            .HasOne(x => x.UserInfoEntity)
            .WithMany(x => x.OrderInfoEntity)
            .HasForeignKey(x => x.StaffId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public static void AddOrderInfoKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OrderInfoEntity>()
            .HasKey(x => x.OrderId);
    }
}

