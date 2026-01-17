// ReSharper disable All

using System.ComponentModel.DataAnnotations.Schema;

namespace DataAccess.Entities.Movie_infos;

public class movie_genre_info_entity
{
    public Guid movieGenreId { get; set; }

    [Column(TypeName = "nvarchar(40)")]
    public string movieGenreName { get; set; } = string.Empty;
    
    [Column(TypeName = "nvarchar(200)")]
    public string movieGenreDescription { get; set; } = string.Empty;

    public List<movieGenreMovieInfoEntity> movie_genre_movie_info_entity { get; set; } = [];
}