namespace Cinema.Domain.Entities.MovieInfos;

public class MovieViewEntity
{
    public Guid MovieViewId { get; set; }

    public Guid MovieId { get; set; }

    public Guid? UserId { get; set; }

    public DateTime ViewedAt { get; set; }

    public MovieInfoEntity MovieInfoEntity { get; set; } = null!;
}

