using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Localization;

namespace Cinema.Application.Policies.TheaterManager.ShowtimeRecommendations;

public static class ScheduleSuggestionPolicy
{
    public static List<string> Validate(
        ShowtimeRecommendationCandidate candidate,
        IEnumerable<MovieScheduleInfoEntity> existingSchedules,
        IEnumerable<ShowtimeRecommendationCandidate> proposedCandidates,
        DateTime nowUtc)
    {
        var errors = new List<string>();

        if (candidate.StartTime < nowUtc)
        {
            errors.Add(Messages.ShowtimeRecommendation.SuggestedShowtimeInPast);
        }

        if (candidate.StartTime < candidate.Movie.ActiveAt || candidate.StartTime.Date > candidate.Movie.EndedDate.Date)
        {
            errors.Add(Messages.ShowtimeRecommendation.MovieOutsideActivePeriod);
        }

        var conflictsExisting = existingSchedules.Any(existing =>
            existing.AuditoriumId == candidate.AuditoriumId &&
            candidate.StartTime < existing.EndedTime.AddMinutes(15) &&
            existing.ActiveAt < candidate.EndTime.AddMinutes(15));

        if (conflictsExisting)
        {
            errors.Add(Messages.ShowtimeRecommendation.ExistingShowtimeConflict);
        }

        var conflictsProposed = proposedCandidates.Any(existing =>
            existing.AuditoriumId == candidate.AuditoriumId &&
            existing.RecommendationId != candidate.RecommendationId &&
            candidate.StartTime < existing.EndTime.AddMinutes(15) &&
            existing.StartTime < candidate.EndTime.AddMinutes(15));

        if (conflictsProposed)
        {
            errors.Add(Messages.ShowtimeRecommendation.SelectedSuggestionConflict);
        }

        return errors;
    }
}

public class ShowtimeRecommendationCandidate
{
    public Guid RecommendationId { get; set; }
    public Guid AuditoriumId { get; set; }
    public string AuditoriumNumber { get; set; } = string.Empty;
    public MovieInfoEntity Movie { get; set; } = null!;
    public Guid FormatId { get; set; }
    public string FormatName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public decimal ConfidenceScore { get; set; }
    public List<string> Reasons { get; set; } = [];
}
