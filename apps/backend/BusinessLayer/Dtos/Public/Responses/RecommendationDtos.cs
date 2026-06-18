using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

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
    [JsonPropertyName("movies")]
    public List<AiMovieItem> Movies { get; set; } = [];
}

public class AiMovieItem
{
    [JsonPropertyName("movie_id")]
    public string MovieId { get; set; } = string.Empty;

    [JsonPropertyName("embedding_text")]
    public string EmbeddingText { get; set; } = string.Empty;
}

public class AiRecommendRequest
{
    [JsonPropertyName("user_text")]
    public string UserText { get; set; } = string.Empty;

    [JsonPropertyName("top_k")]
    public int TopK { get; set; } = 5;
}

public class AiRecommendResponse
{
    [JsonPropertyName("results")]
    public List<AiMovieScore> Results { get; set; } = [];
}

public class AiMovieScore
{
    [JsonPropertyName("movie_id")]
    public string MovieId { get; set; } = string.Empty;

    [JsonPropertyName("distance")]
    public double Distance { get; set; }
}
