using System.Text.Json;
using Cinema.Application.Dtos.TheaterManager.ShowtimeRecommendations;
using Cinema.Application.Policies.TheaterManager.ShowtimeRecommendations;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Localization;

namespace Cinema.Application.Mappers.TheaterManager.ShowtimeRecommendations;

public static class ShowtimeRecommendationMapper
{
    public static ShowtimeRecommendationItemEntity ToEntity(ShowtimeRecommendationCandidate candidate, Guid cinemaId)
    {
        var score = candidate.ConfidenceScore <= 0 ? 50m : candidate.ConfidenceScore;
        return new ShowtimeRecommendationItemEntity
        {
            RecommendationId = candidate.RecommendationId,
            CinemaId = cinemaId,
            AuditoriumId = candidate.AuditoriumId,
            MovieId = candidate.Movie.MovieId,
            FormatId = candidate.FormatId,
            StartTime = candidate.StartTime,
            EndTime = candidate.EndTime,
            ConfidenceScore = score,
            DemandLevel = ShowtimeRecommendationDemandLevel.FromScore(score),
            ExpectedImpact = score >= 75
                ? Messages.ShowtimeRecommendation.HighExpectedImpact
                : Messages.ShowtimeRecommendation.ModerateExpectedImpact,
            ReasonsJson = JsonSerializer.Serialize(candidate.Reasons),
            ScoreSnapshotJson = JsonSerializer.Serialize(new { Score = score, candidate.Reasons })
        };
    }

    public static ShowtimeRecommendationBatchDto ToBatchDto(ShowtimeRecommendationBatchEntity batch)
    {
        return new ShowtimeRecommendationBatchDto
        {
            BatchId = batch.BatchId,
            CinemaId = batch.CinemaId,
            FromDate = batch.FromDate,
            ToDate = batch.ToDate,
            Recommendations = batch.Items.Select(ToItemDto).ToList()
        };
    }

    public static ShowtimeRecommendationItemDto ToItemDto(ShowtimeRecommendationItemEntity item)
    {
        var reasons = JsonSerializer.Deserialize<List<string>>(item.ReasonsJson) ?? [];
        return new ShowtimeRecommendationItemDto
        {
            RecommendationId = item.RecommendationId,
            BatchId = item.BatchId,
            MovieId = item.MovieId,
            MovieName = item.MovieInfoEntity?.MovieName ?? string.Empty,
            MovieImageUrl = item.MovieInfoEntity?.MovieImageUrl ?? string.Empty,
            FormatId = item.FormatId,
            FormatName = item.MovieFormatInfoEntity?.MovieFormatName ?? string.Empty,
            AuditoriumId = item.AuditoriumId,
            AuditoriumNumber = item.AuditoriumInfoEntity?.AuditoriumNumber ?? string.Empty,
            StartTime = item.StartTime,
            EndTime = item.EndTime,
            DemandLevel = item.DemandLevel,
            ConfidenceScore = item.ConfidenceScore,
            ExpectedImpact = item.ExpectedImpact,
            Status = item.Status.ToString(),
            Reasons = reasons,
            AppliedScheduleId = item.AppliedScheduleId
        };
    }

    public static ShowtimeRecommendationCandidate ToCandidate(ShowtimeRecommendationItemEntity item)
    {
        return new ShowtimeRecommendationCandidate
        {
            RecommendationId = item.RecommendationId,
            AuditoriumId = item.AuditoriumId,
            AuditoriumNumber = item.AuditoriumInfoEntity?.AuditoriumNumber ?? string.Empty,
            Movie = item.MovieInfoEntity,
            FormatId = item.FormatId,
            FormatName = item.MovieFormatInfoEntity?.MovieFormatName ?? string.Empty,
            StartTime = item.StartTime,
            EndTime = item.EndTime,
            ConfidenceScore = item.ConfidenceScore,
            Reasons = JsonSerializer.Deserialize<List<string>>(item.ReasonsJson) ?? []
        };
    }

}
