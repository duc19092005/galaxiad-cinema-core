using DataAccess.Entities.Movie_infos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.status_management_relationships_keys.movie_infos;

public class movie_genre_info_relationships_keys
{
    public static void add_movie_genre_info_relationships(ModelBuilder modelBuilder)
    {
        
    }

    public static void add_movie_genre_info_keys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<movie_genre_info_entity>()
            .HasKey(x => x.movieGenreId);

        modelBuilder.Entity<movie_genre_info_entity>()
            .HasIndex(x => x.movieGenreName).IsUnique();

        modelBuilder.Entity<movie_genre_info_entity>()
            .HasIndex(x => x.movieGenreDescription).IsUnique();
    }
}