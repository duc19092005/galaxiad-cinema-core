using DataAccess.Entities.Cinema_Infos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.status_management_relationships_keys;

public class auditorium_info_relationships_keys
{
    public static void add_auditorium_info_relationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<auditorium_info_entity>()
            .HasIndex(a => new { a.auditoriumNumber, a.cinemaId })
            .HasFilter("[isDeleted] = CAST(0 AS BIT)")
            .IsUnique();
        
        modelBuilder.Entity<auditorium_info_entity>().HasOne(x => x.cinema_info_entity)
            .WithMany(x => x.auditorium_info_entity)
            .HasForeignKey(x => x.cinemaId).OnDelete(DeleteBehavior.Restrict);
    }

    public static void add_auditorium_info_keys(ModelBuilder modelBuilder)
    {
        
    }
}