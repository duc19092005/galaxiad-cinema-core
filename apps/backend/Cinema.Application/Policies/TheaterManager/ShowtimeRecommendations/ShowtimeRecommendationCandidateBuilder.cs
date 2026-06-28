using Cinema.Domain.Entities.CinemaInfos;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Localization;
using Cinema.Domain.Utils;

namespace Cinema.Application.Policies.TheaterManager.ShowtimeRecommendations;

public static class ShowtimeRecommendationCandidateBuilder
{
    public static List<ShowtimeRecommendationCandidate> Build(
        IReadOnlyCollection<AuditoriumInfoEntities> auditoriums,
        IReadOnlyCollection<MovieInfoEntity> movies,
        IReadOnlyDictionary<Guid, List<Guid>> movieFormats,
        IReadOnlyDictionary<Guid, string> formatNames,
        IReadOnlyDictionary<Guid, MovieDemandScore> demandScores,
        IReadOnlyCollection<OrderDetailsInfo> paidDetails,
        IReadOnlyCollection<MovieScheduleInfoEntity> existingSchedules,
        DateTime fromUtc,
        DateTime toUtc,
        DateTime nowUtc,
        int maxSuggestions)
    {
        var candidates = new List<(ShowtimeRecommendationCandidate Candidate, decimal Score, List<string> Reasons)>();
        var days = Enumerable.Range(0, Math.Max(1, (toUtc.Date - fromUtc.Date).Days + 1))
            .Select(offset => fromUtc.Date.AddDays(offset));

        foreach (var day in days)
        {
            foreach (var startTime in PrimeTimeAnalyzer.GetCandidateStartTimes(day))
            {
                var start = DateTimeHelper.NormalizeIncoming(day.Add(startTime));
                if (start < fromUtc || start > toUtc || start < nowUtc) continue;

                foreach (var movie in movies)
                {
                    if (!movieFormats.TryGetValue(movie.MovieId, out var supportedMovieFormats)) continue;
                    var demand = demandScores[movie.MovieId];

                    foreach (var auditorium in auditoriums)
                    {
                        var auditoriumFormats = auditorium.AuditoriumFormatInfosList.Select(x => x.FormatId).ToHashSet();
                        var formatId = supportedMovieFormats.FirstOrDefault(auditoriumFormats.Contains);
                        if (formatId == Guid.Empty) continue;

                        var candidate = CreateCandidate(
                            auditorium,
                            movie,
                            formatId,
                            formatNames,
                            start);

                        var errors = ScheduleSuggestionPolicy.Validate(
                            candidate,
                            existingSchedules,
                            candidates.Select(x => x.Candidate),
                            nowUtc);
                        if (errors.Count > 0) continue;

                        var primeScore = PrimeTimeAnalyzer.Score(start, paidDetails);
                        var capacity = Math.Max(1, auditorium.SeatsInfoEntity?.Count ?? 1);
                        var capacityBoost = capacity >= 80 && demand.Score >= 60 ? 10m : capacity < 60 ? 3m : 0m;
                        var finalScore = Math.Round(Math.Min(100m, demand.Score * 0.65m + primeScore * 0.3m + capacityBoost), 2);
                        var reasons = BuildReasons(candidate, demand, primeScore, finalScore);

                        candidates.Add((candidate, finalScore, reasons));
                    }
                }
            }
        }

        return candidates
            .OrderByDescending(x => x.Score)
            .Take(maxSuggestions)
            .Select(x =>
            {
                x.Candidate.ConfidenceScore = x.Score;
                x.Candidate.Reasons = x.Reasons;
                return x.Candidate;
            })
            .ToList();
    }

    private static ShowtimeRecommendationCandidate CreateCandidate(
        AuditoriumInfoEntities auditorium,
        MovieInfoEntity movie,
        Guid formatId,
        IReadOnlyDictionary<Guid, string> formatNames,
        DateTime start)
    {
        return new ShowtimeRecommendationCandidate
        {
            RecommendationId = Guid.NewGuid(),
            AuditoriumId = auditorium.AuditoriumId,
            AuditoriumNumber = auditorium.AuditoriumNumber,
            Movie = movie,
            FormatId = formatId,
            FormatName = formatNames.TryGetValue(formatId, out var formatName) ? formatName : "Default",
            StartTime = start,
            EndTime = start.AddMinutes(movie.MovieDuration)
        };
    }

    private static List<string> BuildReasons(
        ShowtimeRecommendationCandidate candidate,
        MovieDemandScore demand,
        decimal primeScore,
        decimal finalScore)
    {
        var reasons = new List<string>(demand.Reasons)
        {
            Messages.ShowtimeRecommendation.PrimeTimeScore(primeScore),
            Messages.ShowtimeRecommendation.AuditoriumSupports(candidate.AuditoriumNumber, candidate.FormatName),
            ExpectedDemandReason(finalScore)
        };

        return reasons;
    }

    private static string ExpectedDemandReason(decimal score)
    {
        if (score >= 75) return Messages.ShowtimeRecommendation.ExpectedDemandHigh;
        if (score >= 45) return Messages.ShowtimeRecommendation.ExpectedDemandMedium;
        return Messages.ShowtimeRecommendation.ExpectedDemandLow;
    }
}
