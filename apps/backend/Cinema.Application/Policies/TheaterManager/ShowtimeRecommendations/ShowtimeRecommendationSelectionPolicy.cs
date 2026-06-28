using Cinema.Domain.Entities.MovieInfos;

namespace Cinema.Application.Policies.TheaterManager.ShowtimeRecommendations;

public static class ShowtimeRecommendationSelectionPolicy
{
    public static List<ShowtimeRecommendationItemEntity> Select(
        ShowtimeRecommendationBatchEntity batch,
        IEnumerable<Guid> recommendationIds)
    {
        var ids = recommendationIds.ToHashSet();
        return batch.Items
            .Where(x => ids.Count == 0 || ids.Contains(x.RecommendationId))
            .ToList();
    }
}
