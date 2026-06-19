using Cinema.Domain.Entities.MovieInfos;

namespace Cinema.Domain.Entities.CinemaInfos;

public class AuditoriumFormatInfos
{
    public Guid AuditoriumId { get; set; }
    
    public Guid FormatId { get; set; }

    public AuditoriumInfoEntities AuditoriumInfoEntities { get; set; } = null!;

    public MovieFormatInfoEntity MovieFormatInfoEntity { get; set; } = null!;
}