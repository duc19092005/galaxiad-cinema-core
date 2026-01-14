// ReSharper disable All

using DataAccess.Entities.Cinema_Infos;
using DataAccess.Entities.User_Info;
using DataAccess.Entities.Movie_infos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.status_management_relationships_keys;

public class cinema_surcharge_info_relationships_keys
{
    public static void add_cinema_surcharge_info_relationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<cinema_surcharge_infos_entity>().HasOne(x => x.cinema_info_entity)
            .WithMany(y => y.cinema_surcharge_infos_entity).HasForeignKey(x => x.cinemaId);
        
        modelBuilder.Entity<cinema_surcharge_infos_entity>().HasOne(x => x.movie_format_info_entity)
            .WithMany(y => y.cinema_surcharge_infos_entity).HasForeignKey(x => x.movieFormatId);

        modelBuilder.Entity<cinema_surcharge_infos_entity>()
            .HasOne(x => x.user_segments_info_entity).WithMany(x => x.cinema_surcharge_infos_entity)
            .HasForeignKey(x => x.userSegmentId);
    }
    
    public static void add_cinema_surcharge_info_keys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<cinema_surcharge_infos_entity>().HasKey(x => new { x.cinemaId, x.movieFormatId });
        modelBuilder.Entity<cinema_surcharge_infos_entity>()
            .HasIndex(x => new { x.movieFormatId, x.userSegmentId })
            .IsUnique();
    }
}