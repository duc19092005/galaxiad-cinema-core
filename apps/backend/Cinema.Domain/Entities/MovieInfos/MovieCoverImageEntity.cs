using System.ComponentModel.DataAnnotations.Schema;

namespace Cinema.Domain.Entities.MovieInfos;

/// <summary>
/// Multiple cover / banner images for a movie (hero carousel, galleries).
/// </summary>
public class MovieCoverImageEntity
{
    public Guid MovieCoverImageId { get; set; }

    public Guid MovieId { get; set; }

    [Column(TypeName = "varchar(2048)")]
    public string ImageUrl { get; set; } = string.Empty;

    /// <summary>Lower value sorts first in carousels.</summary>
    public int SortOrder { get; set; }

    public bool IsPrimary { get; set; }

    [Column(TypeName = "nvarchar(200)")]
    public string? Caption { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    public MovieInfoEntity MovieInfoEntity { get; set; } = null!;
}
