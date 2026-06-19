using Cinema.Domain.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.RelationshipKeys.MovieInfos;

public static class MovieSheduleInfoRelationshipsKeys
{
    public static void AddMovieSheduleInfoRelationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MovieScheduleInfoEntity>()
            .HasOne(x => x.MovieFormatInfoEntity)
            .WithMany(x => x.movie_schedule_info_entities)
            .HasForeignKey(x => x.MovieFormatId);
        
        modelBuilder.Entity<MovieScheduleInfoEntity>()
            .HasOne(x => x.MovieInfoEntity)
            .WithMany(x => x.MovieScheduleInfoEntity)
            .HasForeignKey(x => x.MovieId)
            .OnDelete(DeleteBehavior.Restrict);
        
        modelBuilder.Entity<MovieScheduleInfoEntity>()
            .HasOne(x => x.AuditoriumInfoEntities)
            .WithMany(x => x.MovieScheduleInfoEntity)
            .HasForeignKey(x => x.AuditoriumId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public static void AddMovieSheduleInfoKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MovieScheduleInfoEntity>()
            .HasKey(x => x.MovieScheduleInfoId);
        
        modelBuilder.Entity<MovieScheduleInfoEntity>()
            .HasIndex(x => new { x.AuditoriumId, x.ActiveAt })
            .IsUnique()
            .HasFilter("[isDeleted] = 0");
    }
}


