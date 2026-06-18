using System.ComponentModel.DataAnnotations;

namespace BusinessLayer.Dtos.Public.Responses;

public class SaveSurveyRequestDto
{
    [Required]
    public List<Guid> PreferredGenreIds { get; set; } = [];

    public string PreferenceDescription { get; set; } = string.Empty;
}

public class SurveyStatusRes
{
    public bool HasCompletedSurvey { get; set; }
    public List<string> PreferredGenreIds { get; set; } = [];
    public string PreferenceDescription { get; set; } = string.Empty;
}

public class RecommendedMovieRes
{
    public Guid MovieId { get; set; }
    public string MovieName { get; set; } = string.Empty;
    public string MoviePosterURL { get; set; } = string.Empty;
    public string MovieBannerURL { get; set; } = string.Empty;
    public string MovieDescription { get; set; } = string.Empty;
    public string MovieGenres { get; set; } = string.Empty;
    public string MovieFormatInfos { get; set; } = string.Empty;
    public string MovieRequiredAge { get; set; } = string.Empty;
    public int MovieDuration { get; set; }
    public bool IsCommingSoon { get; set; }
    public double SimilarityScore { get; set; }
}

public class AiEmbedMoviesRequest
{
    public List<AiMovieItem> Movies { get; set; } = [];
}

public class AiMovieItem
{
    public string MovieId { get; set; } = string.Empty;
    public string EmbeddingText { get; set; } = string.Empty;
}

public class AiRecommendRequest
{
    public string UserText { get; set; } = string.Empty;
    public int TopK { get; set; } = 5;
}

public class AiRecommendResponse
{
    public List<AiMovieScore> Results { get; set; } = [];
}

public class AiMovieScore
{
    public string MovieId { get; set; } = string.Empty;
    public double Distance { get; set; }
}
