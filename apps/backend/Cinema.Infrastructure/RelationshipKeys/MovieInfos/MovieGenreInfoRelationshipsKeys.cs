using Cinema.Domain.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.RelationshipKeys.MovieInfos;

public static class MovieGenreInfoRelationshipsKeys
{
    public static void AddMovieGenreInfoRelationships(ModelBuilder modelBuilder)
    {
        
    }

    public static void AddMovieGenreInfoKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MovieGenreInfoEntity>()
            .HasKey(x => x.MovieGenreId);

        modelBuilder.Entity<MovieGenreInfoEntity>()
            .HasIndex(x => x.MovieGenreName).IsUnique();

        modelBuilder.Entity<MovieGenreInfoEntity>()
            .HasIndex(x => x.MovieGenreDescription).IsUnique();
    }
}

