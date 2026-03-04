using DataAccess.Entities.UserInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.RelationshipKeys.UserInfos;

public static class OrderDetailsInfoRelationshipsKeys
{
    public static void AddOrderDetailsInfoRelationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OrderDetailsInfo>()
            .HasOne(x => x.OrderInfoEntity)
            .WithMany(x => x.OrderDetailsInfo)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Restrict);
        
        modelBuilder.Entity<OrderDetailsInfo>()
            .HasOne(x => x.MovieScheduleInfoEntity)
            .WithMany(x => x.OrderDetailsInfos)
            .HasForeignKey(x => x.MovieScheduleId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<OrderDetailsInfo>()
            .HasOne(x => x.SeatsInfoEntity)
            .WithMany(x => x.OrderDetailsInfo)
            .HasForeignKey(x => x.SeatId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public static void AddOrderDetailsInfoKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OrderDetailsInfo>()
            .HasKey(x => new { orderId = x.OrderId, movieScheduleId = x.MovieScheduleId });
    }
}

