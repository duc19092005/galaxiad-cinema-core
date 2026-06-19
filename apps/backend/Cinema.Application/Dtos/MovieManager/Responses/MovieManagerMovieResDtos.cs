namespace Cinema.Application.Dtos.MovieManager.Responses;

public class ResGetMovieInfosMovieManagerDto
{
    public Guid MovieId { get; set; }
    
    public string MovieName { get; set; } = String.Empty;

    public string MovieDescriptions { get; set; } = string.Empty;
    
    public string MovieImageUrl { get; set; } = string.Empty;

    public string MovieBannerUrl { get; set; } = string.Empty;
    
    public DateTime EndedDate { get; set; }
    
    public DateTime StartedDate { get; set; }

    public List<string> MovieGenresInfos { get; set; } = [];

    public List<string> MovieVisualFormatInfos { get; set; } = [];
    
    public DateTime UpdatedAt { get; set; }
    
    public DateTime CreatedAt { get; set; }

    public string UpdatedBy { get; set; } = String.Empty;

    public string CreatedBy { get; set; } = String.Empty;
    
    public int Duration { get; set; }
    
    public string TrailerUrl { get; set; } = string.Empty;
    
    public string Director { get; set; } = string.Empty;
    
    public string Actors { get; set; } = string.Empty;
    
    public string MovieRequiredAgeSymbol { get; set; } = string.Empty;
    public string MovieManagerName { get; set; } = string.Empty;

    public List<ResMovieCinemaDto> MovieCinemas { get; set; } = [];
}

public class ResMovieCinemaDto
{
    public Guid CinemaId { get; set; }
    public string CinemaName { get; set; } = string.Empty;
}
