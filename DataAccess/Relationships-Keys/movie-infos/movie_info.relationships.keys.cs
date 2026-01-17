using DataAccess.Entities.Movie_infos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.status_management_relationships_keys.movie_infos;

public class movie_info_relationships_keys
{
    public static void add_movie_info_relationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<movieInfoEntity>()
            .HasOne(x => x.movie_required_age_entity).WithMany(x => x.movie_info_entity).HasForeignKey(x => x.movieRequiredAgeId);
    }

    public static void add_movie_info_keys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<movieInfoEntity>().HasKey(x => x.movieId);
        
        modelBuilder.Entity<movieInfoEntity>().HasIndex(x => x.movieName).IsUnique();

        modelBuilder.Entity<movieInfoEntity>().HasIndex(x => x.movieDescription).IsUnique();

        modelBuilder.Entity<movieInfoEntity>().HasIndex(x => x.movieImageUrl).IsUnique();
    }
}