namespace DataAccess.Entities.Movie_infos;

public class movieFormatMovieInfoEntity
{
    public Guid MovieId { get; set; }
    
    public Guid FormatId { get; set; }

    public movieInfoEntity MovieInfoEntity { get; set; } = null!;

    public movieFormatInfoEntity MovieFormatInfoEntity { get; set; } = null!;
}