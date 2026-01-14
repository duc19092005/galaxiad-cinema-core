// ReSharper disable All

namespace DataAccess.Entities.Movie_infos;

public class movie_genre_movie_info_entity
{
    public Guid movieId { get; set; }
    
    public Guid movieGenreId { get; set; }

    public movie_genre_info_entity movie_genre_info_entity { get; set; } = null!;

    public movie_info_entity movie_info_entity { get; set; } = null;
}