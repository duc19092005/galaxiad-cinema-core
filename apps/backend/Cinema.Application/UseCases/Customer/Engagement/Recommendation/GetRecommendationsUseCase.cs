using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Application.Interfaces.Comments;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Domain.Localization;
using Microsoft.Extensions.Logging;

namespace Cinema.Application.UseCases.Customer.Engagement.Recommendation;

public class GetRecommendationsUseCase
{
    private const int FinalTake = 5;
    private const int ExplorationTake = 1;
    private const int AiCandidateTake = 12;
    private const double RecentRatingWeight = 1.0;
    private const double LongTermGenreWeight = 0.82;
    private const double HighQualityInteractionWeight = 0.9;
    private const double SurveyWeight = 0.72;

    private readonly IRecommendationRepository _repository;
    private readonly IAiRecommendationClient _aiClient;
    private readonly ILogger<GetRecommendationsUseCase> _logger;
    private readonly IAiMovieEmbeddingSyncService _aiMovieEmbeddingSyncService;

    public GetRecommendationsUseCase(
        IRecommendationRepository repository,
        IAiRecommendationClient aiClient,
        ILogger<GetRecommendationsUseCase> logger,
        IAiMovieEmbeddingSyncService aiMovieEmbeddingSyncService)
    {
        _repository = repository;
        _aiClient = aiClient;
        _logger = logger;
        _aiMovieEmbeddingSyncService = aiMovieEmbeddingSyncService;
    }

    private sealed record RankedCandidate(Guid MovieId, double Score);
    private sealed record AiQueryGroup(MovieBehaviorSignal Source, List<AiMovieScore> Results, double SourceWeight);

    public async Task<BaseResponse<List<RecommendedMovieRes>>> ExecuteAsync(Guid userId, CancellationToken cancellationToken)
    {
        var interactedMovieIds = await BuildInteractedMovieIdsAsync(userId);
        var survey = await _repository.GetSurveyByUserIdAsync(userId);

        try
        {
            await _aiMovieEmbeddingSyncService.EnsureMoviesSyncedAsync(cancellationToken);

            var recentRatings = await _repository.GetRecentPositiveRatingSignalsAsync(
                userId,
                DateTime.UtcNow.AddDays(-30),
                take: 6);

            if (recentRatings.Count > 0)
            {
                var candidates = await QuerySimilarBySignalsAsync(
                    recentRatings,
                    interactedMovieIds,
                    RecentRatingWeight,
                    cancellationToken);

                if (candidates.Count > 0)
                {
                    return Success(
                        await BuildFinalListAsync(candidates, interactedMovieIds),
                        Messages.Recommendation.BehaviorBased);
                }
            }

            var dominantGenres = await _repository.GetDominantGenreSignalsAsync(userId, majorityThreshold: 0.5, take: 4);
            if (dominantGenres.Count > 0)
            {
                var genreText = BuildLongTermGenreText(dominantGenres);
                var candidates = await QueryByTextAsync(
                    genreText,
                    interactedMovieIds,
                    LongTermGenreWeight,
                    cancellationToken);

                if (candidates.Count > 0)
                {
                    return Success(
                        await BuildFinalListAsync(candidates, interactedMovieIds),
                        Messages.Recommendation.BehaviorBased);
                }
            }

            var highQualityInteractions = await _repository.GetHighQualityInteractionSignalsAsync(
                userId,
                minAverageRating: 4.0,
                take: 5);

            if (highQualityInteractions.Count > 0)
            {
                var candidates = await QuerySimilarBySignalsAsync(
                    highQualityInteractions,
                    interactedMovieIds,
                    HighQualityInteractionWeight,
                    cancellationToken);

                if (candidates.Count > 0)
                {
                    return Success(
                        await BuildFinalListAsync(candidates, interactedMovieIds),
                        Messages.Recommendation.BehaviorBased);
                }
            }

            var surveyText = await BuildSurveyPreferenceTextAsync(survey);
            if (!string.IsNullOrWhiteSpace(surveyText))
            {
                var candidates = await QueryByTextAsync(
                    surveyText,
                    interactedMovieIds,
                    SurveyWeight,
                    cancellationToken);

                if (candidates.Count > 0)
                {
                    return Success(
                        await BuildFinalListAsync(candidates, interactedMovieIds),
                        Messages.Recommendation.BehaviorBased);
                }
            }

            return Success(
                await BuildFallbackListAsync(interactedMovieIds, FinalTake),
                Messages.Recommendation.PopularRecommendations);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to compute personalized recommendations for {UserId}", userId);
            return Success(
                await BuildFallbackListAsync(interactedMovieIds, FinalTake),
                Messages.Recommendation.PopularRecommendations);
        }
    }

    private static BaseResponse<List<RecommendedMovieRes>> Success(List<RecommendedMovieRes> movies, string message)
    {
        return new BaseResponse<List<RecommendedMovieRes>>
        {
            IsSuccess = true,
            Data = movies,
            Message = message
        };
    }

    private async Task<HashSet<Guid>> BuildInteractedMovieIdsAsync(Guid userId)
    {
        var signals = (await _repository.GetViewedMovieSignalsAsync(userId, 30))
            .Concat(await _repository.GetBookedMovieSignalsAsync(userId, 30))
            .Concat(await _repository.GetPositiveRatingSignalsAsync(userId, 30));

        return signals.Select(x => x.MovieId).ToHashSet();
    }

    private async Task<List<RankedCandidate>> QuerySimilarBySignalsAsync(
        List<MovieBehaviorSignal> signals,
        HashSet<Guid> interactedMovieIds,
        double sourceWeight,
        CancellationToken cancellationToken)
    {
        var groups = new List<AiQueryGroup>();
        foreach (var signal in signals.OrderByDescending(x => x.LastAt).ThenByDescending(x => x.Count))
        {
            var excludeIds = interactedMovieIds
                .Append(signal.MovieId)
                .Select(id => id.ToString())
                .Distinct()
                .ToList();

            var request = new AiRecommendByIdRequest
            {
                MovieId = signal.MovieId.ToString(),
                TopK = AiCandidateTake,
                ExcludeIds = excludeIds
            };

            var response = await _aiClient.RecommendByIdAsync(request, cancellationToken);

            if (response?.Results.Count > 0)
            {
                groups.Add(new AiQueryGroup(signal, response.Results, sourceWeight));
            }
        }

        return MergeGroupsRoundRobin(groups, interactedMovieIds, AiCandidateTake);
    }

    private async Task<List<RankedCandidate>> QueryByTextAsync(
        string userText,
        HashSet<Guid> interactedMovieIds,
        double sourceWeight,
        CancellationToken cancellationToken)
    {
        var request = new AiRecommendRequest
        {
            UserText = userText,
            TopK = AiCandidateTake,
            ExcludeIds = interactedMovieIds.Select(id => id.ToString()).ToList()
        };

        var response = await _aiClient.RecommendAsync(request, cancellationToken);

        if (response?.Results.Count is null or 0)
        {
            return [];
        }

        var seen = new HashSet<Guid>(interactedMovieIds);
        var candidates = new List<RankedCandidate>();
        foreach (var result in response.Results)
        {
            if (!Guid.TryParse(result.MovieId, out var movieId) || !seen.Add(movieId))
            {
                continue;
            }

            candidates.Add(new RankedCandidate(movieId, result.Distance * sourceWeight));
        }

        return candidates;
    }

    private static List<RankedCandidate> MergeGroupsRoundRobin(
        List<AiQueryGroup> groups,
        HashSet<Guid> interactedMovieIds,
        int maxTake)
    {
        var candidates = new List<RankedCandidate>();
        var seen = new HashSet<Guid>(interactedMovieIds);
        var maxDepth = groups.Count == 0 ? 0 : groups.Max(group => group.Results.Count);

        for (var depth = 0; depth < maxDepth && candidates.Count < maxTake; depth++)
        {
            foreach (var group in groups)
            {
                if (depth >= group.Results.Count)
                {
                    continue;
                }

                var result = group.Results[depth];
                if (!Guid.TryParse(result.MovieId, out var movieId) || !seen.Add(movieId))
                {
                    continue;
                }

                var score = result.Distance * group.SourceWeight
                    + TimeDecay(group.Source.LastAt) * 0.15
                    + (1.0 / (depth + 1)) * 0.05;
                candidates.Add(new RankedCandidate(movieId, score));

                if (candidates.Count >= maxTake)
                {
                    break;
                }
            }
        }

        return candidates;
    }

    private static double TimeDecay(DateTime lastAt)
    {
        var ageDays = Math.Max(0, (DateTime.UtcNow - lastAt).TotalDays);
        return 1.0 / (1.0 + ageDays / 30.0);
    }

    private async Task<List<RecommendedMovieRes>> BuildFinalListAsync(
        List<RankedCandidate> candidates,
        HashSet<Guid> interactedMovieIds)
    {
        var personalTake = Math.Max(0, FinalTake - ExplorationTake);
        var selectedCandidates = candidates.Take(personalTake).ToList();
        var selected = await MaterializeCandidatesAsync(selectedCandidates);

        var excludeIds = interactedMovieIds
            .Concat(selected.Select(movie => movie.MovieId))
            .ToHashSet();

        if (selected.Count < FinalTake)
        {
            selected.AddRange(await GetRecommendationsWithFallbackAsync(excludeIds, FinalTake - selected.Count));
        }

        ApplyMatchPercentage(selected, higherScoreIsBetter: true);
        return selected.Take(FinalTake).ToList();
    }

    private async Task<List<RecommendedMovieRes>> MaterializeCandidatesAsync(List<RankedCandidate> candidates)
    {
        if (candidates.Count == 0)
        {
            return [];
        }

        var movieIds = candidates.Select(x => x.MovieId).Distinct().ToList();
        var movies = await _repository.LoadRecommendedMoviesAsync(movieIds);
        var movieById = movies.ToDictionary(movie => movie.MovieId);
        var scoreById = candidates
            .GroupBy(x => x.MovieId)
            .ToDictionary(g => g.Key, g => g.Max(x => x.Score));

        var ordered = new List<RecommendedMovieRes>();
        foreach (var candidate in candidates)
        {
            if (!movieById.TryGetValue(candidate.MovieId, out var movie)
                || ordered.Any(x => x.MovieId == movie.MovieId))
            {
                continue;
            }

            movie.SimilarityScore = scoreById.GetValueOrDefault(movie.MovieId);
            ordered.Add(movie);
        }

        return ordered;
    }

    private async Task<List<RecommendedMovieRes>> BuildFallbackListAsync(HashSet<Guid> excludedMovieIds, int take)
    {
        var fallback = await GetRecommendationsWithFallbackAsync(excludedMovieIds, take);
        ApplyMatchPercentage(fallback, higherScoreIsBetter: true);
        return fallback;
    }

    private async Task<List<RecommendedMovieRes>> GetRecommendationsWithFallbackAsync(
        HashSet<Guid> interactedMovieIds,
        int take)
    {
        var result = await _repository.GetFallbackRecommendationsAsync(interactedMovieIds, take);
        if (result.Count < take)
        {
            var excludeIds = interactedMovieIds
                .Concat(result.Select(m => m.MovieId))
                .ToHashSet();
            result.AddRange(await _repository.GetFallbackRecommendationsAsync(excludeIds, take - result.Count));
        }
        return result;
    }

    private async Task<string> BuildSurveyPreferenceTextAsync(UserGenreSurveyEntity? survey)
    {
        if (survey == null)
        {
            return string.Empty;
        }

        var textParts = new List<string>();
        var genreIds = JsonSerializer.Deserialize<List<string>>(survey.PreferredGenreIds) ?? [];
        var genres = await _repository.GetMovieGenreNamesAsync(genreIds);
        if (genres.Count > 0)
        {
            textParts.Add($"User selected favorite cinema genres: {string.Join(", ", genres)}");
        }

        if (!string.IsNullOrWhiteSpace(survey.PreferenceDescription))
        {
            textParts.Add($"User preference description: {survey.PreferenceDescription}");
        }

        return string.Join(". ", textParts);
    }

    private static string BuildLongTermGenreText(List<GenrePreferenceSignal> genres)
    {
        return "User long-term cinema taste is dominated by these genres/tags: "
            + string.Join(", ", genres.Select(x => x.GenreName));
    }

    private static void ApplyMatchPercentage(List<RecommendedMovieRes> movies, bool higherScoreIsBetter)
    {
        if (movies.Count == 0)
        {
            return;
        }

        var scores = movies.Select(m => m.SimilarityScore).ToList();
        var minScore = scores.Min();
        var maxScore = scores.Max();
        var range = maxScore - minScore;

        foreach (var movie in movies)
        {
            if (range <= 0)
            {
                movie.MatchPercentage = 100.0;
                continue;
            }

            var normalized = higherScoreIsBetter
                ? (movie.SimilarityScore - minScore) / range
                : (maxScore - movie.SimilarityScore) / range;
            movie.MatchPercentage = Math.Round(normalized * 100, 1);
        }
    }
}
