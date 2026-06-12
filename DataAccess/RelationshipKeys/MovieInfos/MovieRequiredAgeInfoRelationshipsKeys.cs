using BusinessLayer.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.RelationshipKeys.MovieInfos;

public static class MovieRequiredAgeInfoRelationshipsKeys
{
    public static void AddMovieRequiredAgeInfoRelationships(ModelBuilder modelBuilder)
    {
    }
    
    public static void AddMovieRequiredAgeInfoKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<movieRequiredAgeEntity>().HasKey(x => x.MovieRequiredAgeId);
        
        modelBuilder.Entity<movieRequiredAgeEntity>().HasIndex(x => x.MovieRequiredAgeSymbol).IsUnique();

        modelBuilder.Entity<movieRequiredAgeEntity>().HasIndex(x => x.MovieRequiredAgeDescription).IsUnique();
    }
}
