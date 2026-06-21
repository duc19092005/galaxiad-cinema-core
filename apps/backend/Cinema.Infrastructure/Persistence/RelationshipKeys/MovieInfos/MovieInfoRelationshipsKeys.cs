using Cinema.Domain.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.RelationshipKeys.MovieInfos;

public static class MovieInfoRelationshipsKeys
{
    public static void AddMovieInfoRelationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MovieInfoEntity>()
            .HasOne(x => x.MovieRequiredAgeEntity)
            .WithMany(x => x.MovieInfoEntities)
            .HasForeignKey(x => x.MovieRequiredAgeId);

        // Many-to-Many relationship between Movie and Cinema
        modelBuilder.Entity<MovieCinemaEntity>()
            .HasKey(x => new { x.MovieId, x.CinemaId });

        modelBuilder.Entity<MovieCinemaEntity>()
            .HasOne(x => x.MovieInfoEntity)
            .WithMany(x => x.MovieCinemaEntities)
            .HasForeignKey(x => x.MovieId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MovieCinemaEntity>()
            .HasOne(x => x.CinemaInfoEntity)
            .WithMany(x => x.MovieCinemaEntities)
            .HasForeignKey(x => x.CinemaId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    public static void AddMovieInfoKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MovieInfoEntity>().HasKey(x => x.MovieId);

        modelBuilder.Entity<MovieInfoEntity>().HasIndex(x => x.MovieName).IsUnique();

        modelBuilder.Entity<MovieInfoEntity>().HasIndex(x => x.MovieDescription).IsUnique();

        modelBuilder.Entity<MovieInfoEntity>().HasIndex(x => x.MovieImageUrl).IsUnique();
    }
}

