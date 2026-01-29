using DataAccess.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.RelationshipKeys.MovieInfos;

public static class MovieInfoRelationshipsKeys
{
    public static void AddMovieInfoRelationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MovieInfoEntity>()
            .HasOne(x => x.MovieRequiredAgeEntity).WithMany(x => x.movie_info_entity).HasForeignKey(x => x.MovieRequiredAgeId);
    }

    public static void AddMovieInfoKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MovieInfoEntity>().HasKey(x => x.MovieId);
        
        modelBuilder.Entity<MovieInfoEntity>().HasIndex(x => x.MovieName).IsUnique();

        modelBuilder.Entity<MovieInfoEntity>().HasIndex(x => x.MovieDescription).IsUnique();

        modelBuilder.Entity<MovieInfoEntity>().HasIndex(x => x.MovieImageUrl).IsUnique();
    }
}

