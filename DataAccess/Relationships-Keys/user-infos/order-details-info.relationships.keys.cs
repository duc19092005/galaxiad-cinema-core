using DataAccess.Entities.User_Info;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.status_management_relationships_keys.user_infos;

public class order_details_info_relationships_keys
{
    public static void add_order_details_info_relationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<order_details_info>()
            .HasOne(x => x.order_info)
            .WithMany(x => x.order_details_info)
            .HasForeignKey(x => x.orderId)
            .OnDelete(DeleteBehavior.Restrict);
        
        modelBuilder.Entity<order_details_info>()
            .HasOne(x => x.movie_schedule_info)
            .WithMany(x => x.order_details_infos)
            .HasForeignKey(x => x.movieScheduleId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public static void add_order_details_info_keys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<order_details_info>()
            .HasKey(x => new { x.orderId, x.movieScheduleId });
    }
}