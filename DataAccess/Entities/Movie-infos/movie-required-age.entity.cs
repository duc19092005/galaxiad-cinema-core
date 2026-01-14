// ReSharper disable All

using System.ComponentModel.DataAnnotations.Schema;

namespace DataAccess.Entities.Movie_infos;

public class movie_required_age_entity
{
    public Guid movieRequiredAgeId { get; set; }

    [Column(TypeName = "nchar(10)")]
    public string movieRequiredAgeSymbol { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(2000)")]
    public string movieRequiredAgeDescription { get; set; } = string.Empty;

    public List<movie_info_entity> movie_info_entity = [];
}