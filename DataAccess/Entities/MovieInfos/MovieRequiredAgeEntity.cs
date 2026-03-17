// ReSharper disable All

using System.ComponentModel.DataAnnotations.Schema;

namespace DataAccess.Entities.MovieInfos;

public class movieRequiredAgeEntity
{
    public Guid MovieRequiredAgeId { get; set; }

    [Column(TypeName = "nchar(10)")]
    public string MovieRequiredAgeSymbol { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(2000)")]
    public string MovieRequiredAgeDescription { get; set; } = string.Empty;

    public List<MovieInfoEntity> movie_info_entity { get; set; } = [];
}
