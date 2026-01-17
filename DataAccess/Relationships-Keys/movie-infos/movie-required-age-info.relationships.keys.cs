using DataAccess.Entities.Movie_infos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.status_management_relationships_keys.movie_infos;

public class movie_required_age_info_relationships_keys
{
    public static void add_movie_required_age_info_relationships(ModelBuilder modelBuilder)
    {
    }
    
    public static void add_movie_required_age_info_keys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<movieRequiredAgeEntity>().HasKey(x => x.movieRequiredAgeId);
        
        modelBuilder.Entity<movieRequiredAgeEntity>().HasIndex(x => x.movieRequiredAgeSymbol).IsUnique();

        modelBuilder.Entity<movieRequiredAgeEntity>().HasIndex(x => x.movieRequiredAgeDescription).IsUnique();
    }
}