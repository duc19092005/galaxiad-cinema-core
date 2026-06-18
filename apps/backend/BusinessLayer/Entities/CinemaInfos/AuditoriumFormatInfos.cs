using BusinessLayer.Entities.MovieInfos;

namespace BusinessLayer.Entities.CinemaInfos;

public class AuditoriumFormatInfos
{
    public Guid AuditoriumId { get; set; }
    
    public Guid FormatId { get; set; }

    public AuditoriumInfoEntities AuditoriumInfoEntities { get; set; } = null!;

    public MovieFormatInfoEntity MovieFormatInfoEntity { get; set; } = null!;
}