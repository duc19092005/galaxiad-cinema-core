using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Cinema.Application.Dtos;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Domain.Entities.UserInfos;
using Cinema.Application.Interfaces.Comments;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Cinema.Domain.Localization;

namespace Cinema.Application.UseCases.Customer.Engagement.Recommendation;

public class GetRecommendationsUseCase
{
    private readonly IRecommendationRepository _repository;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GetRecommendationsUseCase> _logger;
    private readonly IAiMovieEmbeddingSyncService _aiMovieEmbeddingSyncService;

    public GetRecommendationsUseCase(
        IRecommendationRepository repository,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<GetRecommendationsUseCase> logger,
        IAiMovieEmbeddingSyncService aiMovieEmbeddingSyncService)
    {
        _repository = repository;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
        _aiMovieEmbeddingSyncService = aiMovieEmbeddingSyncService;
    }

    private sealed record UserBehaviorProfile(string UserText, HashSet<Guid> InteractedMovieIds);

    public async Task<BaseResponse<List<RecommendedMovieRes>>> ExecuteAsync(Guid userId, CancellationToken cancellationToken)
    {
        var survey = await _repository.GetSurveyByUserIdAsync(userId);

        var profile = await BuildUserBehaviorProfileAsync(userId, survey);
        if (string.IsNullOrWhiteSpace(profile.UserText))
        {
            var fallback = await GetRecommendationsWithFallbackAsync(profile.InteractedMovieIds, 5);
            ApplyMatchPercentage(fallback, invertDistance: false);
            return new BaseResponse<List<RecommendedMovieRes>>
            {
                IsSuccess = true,
                Data = fallback,
                Message = Messages.Recommendation.PopularRecommendations
            };
        }

        try
        {
            await _aiMovieEmbeddingSyncService.EnsureMoviesSyncedAsync(cancellationToken);

            var aiServiceUrl = _configuration["AiService:BaseUrl"] ?? "http://cinema-ai-service:8000";
            var client = _httpClientFactory.CreateClient();

            var reqBody = new AiRecommendRequest { UserText = profile.UserText, TopK = 12 };
            var content = new StringContent(JsonSerializer.Serialize(reqBody), Encoding.UTF8, "application/json");

            var response = await client.PostAsync($"{aiServiceUrl}/recommend", content, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("AI service returned {StatusCode}", response.StatusCode);
                var fallback = await GetRecommendationsWithFallbackAsync(profile.InteractedMovieIds, 5);
                ApplyMatchPercentage(fallback, invertDistance: false);
                return new BaseResponse<List<RecommendedMovieRes>>
                {
                    IsSuccess = true,
                    Data = fallback,
                    Message = Messages.Recommendation.PopularRecommendations
                };
            }

            var aiResult = JsonSerializer.Deserialize<AiRecommendResponse>(
                await response.Content.ReadAsStringAsync(cancellationToken),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (aiResult == null || aiResult.Results.Count == 0)
            {
                var fallback = await GetRecommendationsWithFallbackAsync(profile.InteractedMovieIds, 5);
                ApplyMatchPercentage(fallback, invertDistance: false);
                return new BaseResponse<List<RecommendedMovieRes>>
                {
                    IsSuccess = true,
                    Data = fallback,
                    Message = Messages.Recommendation.PopularRecommendations
                };
            }

            var movieIds = aiResult.Results
                .Select(r => Guid.TryParse(r.MovieId, out var id) ? id : Guid.Empty)
                .Where(id => id != Guid.Empty && !profile.InteractedMovieIds.Contains(id))
                .Distinct()
                .ToList();

            var movies = await _repository.LoadRecommendedMoviesAsync(movieIds);

            var scoreByMovieId = aiResult.Results
                .Where(score => Guid.TryParse(score.MovieId, out _))
                .ToDictionary(score => Guid.Parse(score.MovieId), score => score.Distance);

            foreach (var movie in movies)
            {
                movie.SimilarityScore = scoreByMovieId.GetValueOrDefault(movie.MovieId);
            }

            var orderedMovies = movieIds
                .Select(id => movies.FirstOrDefault(m => m.MovieId == id))
                .Where(m => m != null)
                .Cast<RecommendedMovieRes>()
                .Take(5)
                .ToList();

            if (orderedMovies.Count < 5)
            {
                var excludeIds = profile.InteractedMovieIds
                    .Concat(orderedMovies.Select(m => m.MovieId))
                    .ToHashSet();
                var fallback = await GetRecommendationsWithFallbackAsync(
                    excludeIds, 
                    5 - orderedMovies.Count, 
                    orderedMovies.Select(m => m.MovieId).ToHashSet());
                orderedMovies.AddRange(fallback);
            }

            // AI distance: nhỏ hơn = khớp hơn → đảo chiều để tính % phù hợp
            ApplyMatchPercentage(orderedMovies, invertDistance: true);
            return new BaseResponse<List<RecommendedMovieRes>>
            {
                IsSuccess = true,
                Data = orderedMovies,
                Message = Messages.Recommendation.BehaviorBased
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling AI service");
            var fallback = await GetRecommendationsWithFallbackAsync(profile.InteractedMovieIds, 5);
            ApplyMatchPercentage(fallback, invertDistance: false);
            return new BaseResponse<List<RecommendedMovieRes>>
            {
                IsSuccess = true,
                Data = fallback,
                Message = Messages.Recommendation.PopularRecommendations
            };
        }
    }

    private async Task<List<RecommendedMovieRes>> GetRecommendationsWithFallbackAsync(
        HashSet<Guid> interactedMovieIds, 
        int take, 
        HashSet<Guid>? alreadyRecommendedMovieIds = null)
    {
        var result = await _repository.GetFallbackRecommendationsAsync(interactedMovieIds, take);
        if (result.Count < take)
        {
            var excludeIds = result.Select(m => m.MovieId)
                .Concat(alreadyRecommendedMovieIds ?? [])
                .ToHashSet();
            var extra = await _repository.GetFallbackRecommendationsAsync(excludeIds, take - result.Count);
            result.AddRange(extra);
        }
        return result;
    }

    /// <summary>
    /// Quy đổi SimilarityScore của toàn bộ danh sách về thang MatchPercentage (0–100%).
    /// 
    /// - invertDistance = false (Fallback): SimilarityScore cao hơn → % cao hơn.
    ///   Dùng Min-Max normalization:
    ///     MatchPercentage = (score - min) / (max - min) * 100
    ///
    /// - invertDistance = true (AI Embedding): SimilarityScore là khoảng cách Euclidean,
    ///   giá trị nhỏ hơn nghĩa là khớp hơn, nên đảo chiều:
    ///     MatchPercentage = (1 - score / maxScore) * 100
    ///
    /// Nếu tất cả điểm bằng nhau, gán 100% cho tất cả (tất cả đều phù hợp).
    /// </summary>
    private static void ApplyMatchPercentage(List<RecommendedMovieRes> movies, bool invertDistance)
    {
        if (movies.Count == 0) return;

        var scores = movies.Select(m => m.SimilarityScore).ToList();
        var minScore = scores.Min();
        var maxScore = scores.Max();
        var range = maxScore - minScore;

        foreach (var movie in movies)
        {
            if (invertDistance)
            {
                // Khoảng cách AI: nhỏ hơn = tốt hơn → đảo chiều
                movie.MatchPercentage = maxScore > 0
                    ? Math.Round((1.0 - movie.SimilarityScore / maxScore) * 100, 1)
                    : 100.0;
            }
            else
            {
                // Fallback score: lớn hơn = tốt hơn → Min-Max normalize
                movie.MatchPercentage = range > 0
                    ? Math.Round((movie.SimilarityScore - minScore) / range * 100, 1)
                    : 100.0;
            }
        }
    }

    private async Task<UserBehaviorProfile> BuildUserBehaviorProfileAsync(Guid userId, UserGenreSurveyEntity? survey)
    {
        var textParts = new List<string>();
        var interactedMovieIds = new HashSet<Guid>();

        await AddSurveySignalsAsync(survey, textParts);
        await AddViewedMovieSignalsAsync(userId, textParts, interactedMovieIds);
        await AddBookedMovieSignalsAsync(userId, textParts, interactedMovieIds);
        await AddPositiveRatingSignalsAsync(userId, textParts, interactedMovieIds);

        return new UserBehaviorProfile(
            textParts.Count == 0 ? string.Empty : string.Join(". ", textParts),
            interactedMovieIds);
    }

    private async Task AddSurveySignalsAsync(UserGenreSurveyEntity? survey, List<string> textParts)
    {
        if (survey == null) return;

        var genreIds = JsonSerializer.Deserialize<List<string>>(survey.PreferredGenreIds) ?? [];
        var genres = await _repository.GetMovieGenreNamesAsync(genreIds);

        if (genres.Count > 0)
        {
            textParts.Add($"User selected favorite genres: {string.Join(", ", genres)}");
        }

        if (!string.IsNullOrWhiteSpace(survey.PreferenceDescription))
        {
            textParts.Add($"Survey preference description: {survey.PreferenceDescription}");
        }
    }

    private async Task AddViewedMovieSignalsAsync(Guid userId, List<string> textParts, HashSet<Guid> interactedMovieIds)
    {
        var signals = await _repository.GetViewedMovieSignalsAsync(userId, 8);
        AddSignals(interactedMovieIds, signals);

        var snippets = await _repository.LoadMoviePreferenceSnippetsAsync(signals.Select(x => x.MovieId));
        if (snippets.Count > 0)
        {
            textParts.Add($"User often views/clicks movies: {string.Join("; ", snippets)}");
        }
    }

    private async Task AddBookedMovieSignalsAsync(Guid userId, List<string> textParts, HashSet<Guid> interactedMovieIds)
    {
        var signals = await _repository.GetBookedMovieSignalsAsync(userId, 8);
        AddSignals(interactedMovieIds, signals);

        var snippets = await _repository.LoadMoviePreferenceSnippetsAsync(signals.Select(x => x.MovieId));
        if (snippets.Count > 0)
        {
            textParts.Add($"User has booked tickets for movies: {string.Join("; ", snippets)}");
        }
    }

    private async Task AddPositiveRatingSignalsAsync(Guid userId, List<string> textParts, HashSet<Guid> interactedMovieIds)
    {
        var signals = await _repository.GetPositiveRatingSignalsAsync(userId, 8);
        AddSignals(interactedMovieIds, signals);

        var snippets = await _repository.LoadMoviePreferenceSnippetsAsync(signals.Select(x => x.MovieId));
        if (snippets.Count > 0)
        {
            textParts.Add($"User rated these movies highly: {string.Join("; ", snippets)}");
        }
    }

    private static void AddSignals(HashSet<Guid> target, IEnumerable<MovieBehaviorSignal> signals)
    {
        foreach (var signal in signals)
        {
            target.Add(signal.MovieId);
        }
    }
}

