using BusinessLayer.Entities.CinemaInfos;

namespace BusinessLayer.Entities.MovieInfos;

public class MovieCinemaEntity
{
    public Guid MovieId { get; set; }
    public MovieInfoEntity MovieInfoEntity { get; set; } = null!;

    public Guid CinemaId { get; set; }
    public CinemaInfoEntity CinemaInfoEntity { get; set; } = null!;

    // Metadata for each cinema context if needed (e.g. specialized movie image per cinema)
}
