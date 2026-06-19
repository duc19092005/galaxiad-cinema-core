using Cinema.Domain.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.RelationshipKeys.MovieInfos;

public static class MovieGenreMovieInfoRelationshipsKeys
{
    public static void AddMovieGenreMovieInfoRelationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MovieGenreMovieInfoEntity>()
            .HasOne(x => x.movie_info_entity).WithMany(x => x.MovieGenreMovieInfoEntity)
            .HasForeignKey(x => x.MovieId);
        
        modelBuilder.Entity<MovieGenreMovieInfoEntity>()
            .HasOne(x => x.MovieGenreInfoEntity).WithMany(x => x.MovieGenreMovieInfoEntity)
            .HasForeignKey(x => x.MovieGenreId);
    }

    public static void AddMovieGenreMovieInfoKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MovieGenreMovieInfoEntity>()
            .HasKey(x => new { movieGenreId = x.MovieGenreId, movieId = x.MovieId });
    }
}


