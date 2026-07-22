namespace Cinema.Application.Dtos.MovieManager.Responses;

public class ExternalMovieSearchItemDto
{
    public int TmdbId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? OriginalTitle { get; set; }
    public string? ReleaseDate { get; set; }
    public string? Overview { get; set; }
    public string? PosterUrl { get; set; }
}

public class ExternalPersonSearchItemDto
{
    public int TmdbId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? KnownForDepartment { get; set; }
    public string? ProfileUrl { get; set; }
    public double Popularity { get; set; }
}

public class ExternalMovieCreditsDto
{
    public int TmdbId { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<string> Directors { get; set; } = [];
    public List<ExternalCastMemberDto> Cast { get; set; } = [];
}

public class ExternalCastMemberDto
{
    public int TmdbId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Character { get; set; }
    public string? ProfileUrl { get; set; }
    public int Order { get; set; }
}
