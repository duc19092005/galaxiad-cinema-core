// ReSharper disable All

namespace BusinessLayer.Entities.MovieInfos;

public class MovieGenreMovieInfoEntity
{
    public Guid MovieId { get; set; }
    
    public Guid MovieGenreId { get; set; }

    public MovieGenreInfoEntity MovieGenreInfoEntity { get; set; } = null!;

    public MovieInfoEntity movie_info_entity { get; set; } = null;
}

