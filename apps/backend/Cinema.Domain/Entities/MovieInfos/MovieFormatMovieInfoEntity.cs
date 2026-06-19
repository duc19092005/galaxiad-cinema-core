namespace Cinema.Domain.Entities.MovieInfos;

public class movieFormatMovieInfoEntity
{
    public Guid MovieId { get; set; }
    
    public Guid FormatId { get; set; }

    public MovieInfoEntity MovieInfoEntity { get; set; } = null!;

    public MovieFormatInfoEntity MovieFormatInfoEntity { get; set; } = null!;
}
