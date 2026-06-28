using Cinema.Domain.Entities.UserInfos;

namespace Cinema.Application.Policies.TheaterManager.ShowtimeRecommendations;

public static class PrimeTimeAnalyzer
{
    public static decimal Score(DateTime localStartTime, IEnumerable<OrderDetailsInfo> historicalDetails)
    {
        var hour = localStartTime.Hour;
        var day = localStartTime.DayOfWeek;
        var isWeekend = day is DayOfWeek.Saturday or DayOfWeek.Sunday;

        var baseScore = 20m;
        if (hour >= 18 && hour <= 22) baseScore += 45m;
        if (isWeekend && hour >= 10 && hour <= 12) baseScore += 20m;
        if (isWeekend && hour >= 14 && hour <= 17) baseScore += 25m;
        if (isWeekend && hour >= 18 && hour <= 22) baseScore += 15m;

        var sameHourTickets = historicalDetails.Count(x => x.MovieScheduleInfoEntity.ActiveAt.Hour == hour);
        baseScore += Math.Min(sameHourTickets * 1.5m, 25m);

        return Math.Round(Math.Min(baseScore, 100m), 2);
    }

    public static IEnumerable<TimeSpan> GetCandidateStartTimes(DateTime date)
    {
        var isWeekend = date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
        if (isWeekend)
        {
            yield return new TimeSpan(10, 0, 0);
            yield return new TimeSpan(14, 0, 0);
            yield return new TimeSpan(16, 30, 0);
            yield return new TimeSpan(18, 30, 0);
            yield return new TimeSpan(20, 45, 0);
        }
        else
        {
            yield return new TimeSpan(18, 30, 0);
            yield return new TimeSpan(20, 45, 0);
        }
    }
}
