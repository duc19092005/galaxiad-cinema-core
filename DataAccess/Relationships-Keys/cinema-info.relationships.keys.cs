using DataAccess.Entities.Cinema_Infos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace DataAccess.status_management_relationships_keys;

public class cinema_info_relationship_keys
{
    public static void add_cinema_info_relationships(ModelBuilder modelBuilder)
    {
        
    }
    
    public static void add_cinema_info_keys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<cinema_info_entity>()
            .HasIndex(a => new { a.cinemaName })
            .HasFilter("[isDeleted] = CAST(0 AS BIT)")
            .IsUnique();

        modelBuilder.Entity<cinema_info_entity>().HasIndex(a => new { a.cinemaHotLineNumber })
            .IsUnique();
    }
}