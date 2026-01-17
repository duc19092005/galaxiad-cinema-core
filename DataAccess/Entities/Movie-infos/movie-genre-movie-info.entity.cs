// ReSharper disable All

namespace DataAccess.Entities.Movie_infos;

public class movieGenreMovieInfoEntity
{
    public Guid movieId { get; set; }
    
    public Guid movieGenreId { get; set; }

    public movie_genre_info_entity movie_genre_info_entity { get; set; } = null!;

    public movieInfoEntity movie_info_entity { get; set; } = null;
}