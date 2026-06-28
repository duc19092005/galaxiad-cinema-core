using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Localization;

namespace Cinema.Application.Policies.TheaterManager.ShowtimeRecommendations;

public record MovieDemandScore(
    Guid MovieId,
    decimal Score,
    int TicketsSold,
    int RecentTicketsSold,
    decimal Revenue,
    int ViewCount,
    decimal AverageRating,
    int RatingCount,
    List<string> Reasons);

public static class MovieDemandScorer
{
    public static Dictionary<Guid, MovieDemandScore> Score(
        IEnumerable<MovieInfoEntity> movies,
        IEnumerable<OrderDetailsInfo> paidOrderDetails,
        IReadOnlyDictionary<Guid, int> viewCounts,
        IReadOnlyDictionary<Guid, (decimal Average, int Count)> ratings,
        DateTime nowUtc)
    {
        var detailsByMovie = paidOrderDetails
            .GroupBy(x => x.MovieScheduleInfoEntity.MovieId)
            .ToDictionary(x => x.Key, x => x.ToList());

        var result = new Dictionary<Guid, MovieDemandScore>();

        foreach (var movie in movies)
        {
            detailsByMovie.TryGetValue(movie.MovieId, out var details);
            details ??= [];

            var recentCutoff = nowUtc.AddDays(-7);
            var ticketsSold = details.Count;
            var recentTickets = details.Count(x => x.OrderInfoEntity.OrderDate >= recentCutoff);
            var revenue = details.Sum(x => x.PriceEach);
            var views = viewCounts.TryGetValue(movie.MovieId, out var viewCount) ? viewCount : 0;
            var rating = ratings.TryGetValue(movie.MovieId, out var ratingInfo)
                ? ratingInfo
                : (Average: 0m, Count: 0);
            var daysSinceRelease = Math.Max(0, (nowUtc.Date - movie.ActiveAt.Date).TotalDays);
            var freshness = daysSinceRelease <= 14 ? 12m : daysSinceRelease <= 30 ? 6m : 0m;

            var score =
                ticketsSold * 1.5m +
                recentTickets * 3m +
                Math.Min(revenue / 100000m, 30m) +
                Math.Min(views * 0.4m, 20m) +
                rating.Average * Math.Min(rating.Count, 20) * 0.6m +
                freshness;

            var reasons = new List<string>();
            if (recentTickets > 0) reasons.Add(Messages.ShowtimeRecommendation.RecentTicketsSold(recentTickets));
            if (ticketsSold > 0) reasons.Add(Messages.ShowtimeRecommendation.TotalPaidTickets(ticketsSold));
            if (views > 0) reasons.Add(Messages.ShowtimeRecommendation.CustomerViews(views));
            if (rating.Average >= 4) reasons.Add(Messages.ShowtimeRecommendation.StrongAudienceRating(rating.Average));
            if (freshness > 0) reasons.Add(Messages.ShowtimeRecommendation.RecentReleaseFreshness);
            if (reasons.Count == 0) reasons.Add(Messages.ShowtimeRecommendation.EligibleActiveMovie);

            result[movie.MovieId] = new MovieDemandScore(
                movie.MovieId,
                Math.Round(score, 2),
                ticketsSold,
                recentTickets,
                revenue,
                views,
                rating.Average,
                rating.Count,
                reasons);
        }

        return result;
    }
}
