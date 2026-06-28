using Cinema.Application.Dtos.TheaterManager.ShowtimeRecommendations;
using Cinema.Application.Interfaces.TheaterManager;
using Cinema.Application.Mappers.TheaterManager.ShowtimeRecommendations;
using Cinema.Application.Policies.TheaterManager.ShowtimeRecommendations;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Localization;

namespace Cinema.Application.Services.TheaterManager.ShowtimeRecommendations;

public class ShowtimeRecommendationPreviewService
{
    private readonly IShowtimeRecommendationRepository _repository;

    public ShowtimeRecommendationPreviewService(IShowtimeRecommendationRepository repository)
    {
        _repository = repository;
    }

    public async Task<ShowtimeRecommendationPreviewDto> BuildAsync(
        ShowtimeRecommendationBatchEntity batch,
        List<ShowtimeRecommendationItemEntity> selected)
    {
        var existingSchedules = await _repository.GetSchedulesForCinemaAsync(
            batch.CinemaId,
            batch.FromDate.AddDays(-1),
            batch.ToDate.AddDays(1));
        var candidates = selected.Select(ShowtimeRecommendationMapper.ToCandidate).ToList();
        var preview = new ShowtimeRecommendationPreviewDto { BatchId = batch.BatchId };

        foreach (var candidate in candidates)
        {
            var errors = ScheduleSuggestionPolicy.Validate(candidate, existingSchedules, candidates, DateTime.UtcNow);
            var validation = new ShowtimeRecommendationValidationDto
            {
                RecommendationId = candidate.RecommendationId,
                MovieName = candidate.Movie.MovieName,
                AuditoriumNumber = candidate.AuditoriumNumber,
                StartTime = candidate.StartTime,
                EndTime = candidate.EndTime,
                IsValid = errors.Count == 0,
                Reasons = errors.Count == 0 ? [Messages.ShowtimeRecommendation.ReadyToApply] : errors
            };

            if (validation.IsValid)
            {
                preview.ValidSuggestions.Add(validation);
            }
            else
            {
                preview.InvalidSuggestions.Add(validation);
            }
        }

        if (preview.ValidSuggestions.Count == 0)
        {
            preview.Warnings.Add(Messages.ShowtimeRecommendation.NoSelectedRecommendationCanApply);
        }

        return preview;
    }
}
