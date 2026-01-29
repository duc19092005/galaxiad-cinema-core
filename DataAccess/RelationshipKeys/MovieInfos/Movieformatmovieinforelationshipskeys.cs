using DataAccess.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.RelationshipKeys.MovieInfos;

public static class MovieFormatMovieInfoRelationshipsKeys
{
    public static void AddMovieFormatMovieInfoRelationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<movieFormatMovieInfoEntity>()
            .HasOne(x => x.MovieInfoEntity)
            .WithMany(x => x.MovieFormatMovieInfoEntity)
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
