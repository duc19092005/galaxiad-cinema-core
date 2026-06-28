namespace Cinema.Application.Dtos.TheaterManager.ShowtimeRecommendations;

public class GenerateShowtimeRecommendationsRequest
{
    public Guid CinemaId { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public Guid? AuditoriumId { get; set; }
    public int? MaxSuggestions { get; set; }
}

public class ShowtimeRecommendationBatchDto
{
    public Guid BatchId { get; set; }
    public Guid CinemaId { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public List<ShowtimeRecommendationItemDto> Recommendations { get; set; } = [];
}

public class ShowtimeRecommendationItemDto
{
    public Guid RecommendationId { get; set; }
    public Guid BatchId { get; set; }
    public Guid MovieId { get; set; }
    public string MovieName { get; set; } = string.Empty;
    public string MovieImageUrl { get; set; } = string.Empty;
    public Guid FormatId { get; set; }
    public string FormatName { get; set; } = string.Empty;
    public Guid AuditoriumId { get; set; }
    public string AuditoriumNumber { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string DemandLevel { get; set; } = "Medium";
    public decimal ConfidenceScore { get; set; }
    public string ExpectedImpact { get; set; } = string.Empty;
    public string Status { get; set; } = "Suggested";
    public List<string> Reasons { get; set; } = [];
    public Guid? AppliedScheduleId { get; set; }
}

public class RecommendationSelectionRequest
{
    public Guid BatchId { get; set; }
    public List<Guid> RecommendationIds { get; set; } = [];
}

public class ApplyShowtimeRecommendationsRequest : RecommendationSelectionRequest
{
    public bool ApplyValidOnly { get; set; }
}

public class ShowtimeRecommendationPreviewDto
{
    public Guid BatchId { get; set; }
    public List<ShowtimeRecommendationValidationDto> ValidSuggestions { get; set; } = [];
    public List<ShowtimeRecommendationValidationDto> InvalidSuggestions { get; set; } = [];
    public List<string> Warnings { get; set; } = [];
}

public class ShowtimeRecommendationValidationDto
{
    public Guid RecommendationId { get; set; }
    public string MovieName { get; set; } = string.Empty;
    public string AuditoriumNumber { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public bool IsValid { get; set; }
    public List<string> Reasons { get; set; } = [];
}

public class ApplyShowtimeRecommendationsResponse
{
    public Guid BatchId { get; set; }
    public List<AppliedShowtimeRecommendationDto> Applied { get; set; } = [];
    public List<ShowtimeRecommendationValidationDto> Failed { get; set; } = [];
}

public class AppliedShowtimeRecommendationDto
{
    public Guid RecommendationId { get; set; }
    public Guid ScheduleId { get; set; }
    public string MovieName { get; set; } = string.Empty;
    public string AuditoriumNumber { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}

public class ShowtimeRecommendationHistoryDto
{
    public Guid BatchId { get; set; }
    public Guid CinemaId { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public int SuggestedCount { get; set; }
    public int AppliedCount { get; set; }
    public int DismissedCount { get; set; }
}

