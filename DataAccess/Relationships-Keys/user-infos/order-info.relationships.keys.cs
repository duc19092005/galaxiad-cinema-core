using DataAccess.Entities.User_Info;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.status_management_relationships_keys.user_infos;

public class order_info_relationships_keys
{
    public static void add_order_info_relationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<order_info_entity>()
            .HasOne(x => x.user_info)
            .WithMany(x => x.order_info_entity)
            .HasForeignKey(x => x.userId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public static void add_order_info_keys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<order_info_entity>()
            .HasKey(x => x.orderId);

        modelBuilder.Entity<order_info_entity>()
            .HasIndex(x => new { x.userId, x.orderId })
            .IsUnique();
    }
}