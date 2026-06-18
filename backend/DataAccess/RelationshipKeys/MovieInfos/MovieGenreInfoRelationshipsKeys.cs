using BusinessLayer.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.RelationshipKeys.MovieInfos;

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

