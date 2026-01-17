using DataAccess.Entities.Movie_infos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.status_management_relationships_keys.movie_infos;

public class movie_shedule_info_relationships_keys
{
    public static void add_movie_shedule_info_relationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<movie_schedule_info_entity>()
            .HasOne(x => x.movie_format_info_entity)
            .WithMany(x => x.movie_schedule_info_entities)
            .HasForeignKey(x => x.movieFormatId);
        
        modelBuilder.Entity<movie_schedule_info_entity>()
            .HasOne(x => x.movie_info_entity)
            .WithMany(x => x.movie_schedule_info_entity)
            .HasForeignKey(x => x.movieId)
            .OnDelete(DeleteBehavior.Restrict);
        
        modelBuilder.Entity<movie_schedule_info_entity>()
            .HasOne(x => x.auditorium_info_entity)
            .WithMany(x => x.movie_schedule_info_entity)
            .HasForeignKey(x => x.auditoriumId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public static void add_movie_shedule_info_keys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<movie_schedule_info_entity>()
            .HasKey(x => x.movieScheduleInfoId);
        
        modelBuilder.Entity<movie_schedule_info_entity>()
            .HasIndex(x => new { x.auditoriumId, x.startedTime })
            .IsUnique()
            .HasFilter("[isDeleted] = 0");
    }
}