using DataAccess.Entities.Movie_infos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.status_management_relationships_keys.movie_infos;

public class movie_genre_movie_info_relationships_keys
{
    public static void movie_genre_movie_info_relationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<movie_genre_movie_info_entity>()
            .HasOne(x => x.movie_info_entity).WithMany(x => x.movie_genre_movie_info_entity)
            .HasForeignKey(x => x.movieId);
        
        modelBuilder.Entity<movie_genre_movie_info_entity>()
            .HasOne(x => x.movie_genre_info_entity).WithMany(x => x.movie_genre_movie_info_entity)
            .HasForeignKey(x => x.movieGenreId);
    }

    public static void movie_genre_movie_info_keys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<movie_genre_movie_info_entity>()
            .HasKey(x => new { x.movieGenreId, x.movieId });
    }
}