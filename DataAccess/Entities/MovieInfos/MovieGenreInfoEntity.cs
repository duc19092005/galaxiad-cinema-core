// ReSharper disable All

using System.ComponentModel.DataAnnotations.Schema;

namespace DataAccess.Entities.MovieInfos;

public class MovieGenreInfoEntity
{
    public Guid MovieGenreId { get; set; }

    [Column(TypeName = "nvarchar(40)")]
    public string MovieGenreName { get; set; } = string.Empty;
    
    [Column(TypeName = "nvarchar(200)")]
    public string MovieGenreDescription { get; set; } = string.Empty;

    public List<MovieGenreMovieInfoEntity> MovieGenreMovieInfoEntity { get; set; } = [];
}


