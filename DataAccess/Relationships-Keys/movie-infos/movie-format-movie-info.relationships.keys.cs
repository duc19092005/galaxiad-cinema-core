using DataAccess.Entities.Movie_infos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Relationships_Keys.movie_infos;

public static class movieFormatMovieInfoRelationshipsKeys
{
    public static void AddMovieFormatMovieInfoRelationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<movieFormatMovieInfoEntity>()
            .HasOne(x => x.MovieInfoEntity)
            .WithMany(x => x.movieFormatMovieInfoEntity)
            .HasForeignKey(x => x.MovieId)
            .OnDelete(DeleteBehavior.Restrict);
        
        modelBuilder.Entity<movieFormatMovieInfoEntity>()
            .HasOne(x => x.MovieFormatInfoEntity)
            .WithMany(x => x.movieFormatMovieInfoEntities)
            .HasForeignKey(x => x.FormatId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public static void AddMovieFormatMovieInfoKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<movieFormatMovieInfoEntity>()
            .HasKey(x => new { x.MovieId, x.FormatId });
    }
}