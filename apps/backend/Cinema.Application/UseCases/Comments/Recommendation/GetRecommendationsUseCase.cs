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

namespace Cinema.Application.UseCases.Comments.Recommendation;

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
            var fallback = await _repository.GetFallbackRecommendationsAsync(profile.InteractedMovieIds, 5);
            return new BaseResponse<List<RecommendedMovieRes>>
            {
                IsSuccess = true,
                Data = fallback,
                Message = "Popular recommendations"
            };
        }

        try
        {
            await _aiMovieEmbeddingSyncService.EnsureMoviesSyncedAsync(cancellationToken);

            var aiServiceUrl = _configuration["AiService:BaseUrl"] ?? "http://ai-service:8000";
            var client = _httpClientFactory.CreateClient();

            var reqBody = new AiRecommendRequest { UserText = profile.UserText, TopK = 12 };
            var content = new StringContent(JsonSerializer.Serialize(reqBody), Encoding.UTF8, "application/json");

            var response = await client.PostAsync($"{aiServiceUrl}/recommend", content, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("AI service returned {StatusCode}", response.StatusCode);
                var fallback = await _repository.GetFallbackRecommendationsAsync(profile.InteractedMovieIds, 5);
                return new BaseResponse<List<RecommendedMovieRes>>
                {
                    IsSuccess = true,
                    Data = fallback,
                    Message = "Popular recommendations"
                };
            }

            var aiResult = JsonSerializer.Deserialize<AiRecommendResponse>(
                await response.Content.ReadAsStringAsync(cancellationToken),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (aiResult == null || aiResult.Results.Count == 0)
            {
                var fallback = await _repository.GetFallbackRecommendationsAsync(profile.InteractedMovieIds, 5);
                return new BaseResponse<List<RecommendedMovieRes>>
                {
                    IsSuccess = true,
                    Data = fallback,
                    Message = "Popular recommendations"
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
                var fallback = await _repository.GetFallbackRecommendationsAsync(excludeIds, 5 - orderedMovies.Count);
                orderedMovies.AddRange(fallback);
            }

            return new BaseResponse<List<RecommendedMovieRes>>
            {
                IsSuccess = true,
                Data = orderedMovies,
                Message = "Behavior-based recommendations"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling AI service");
            var fallback = await _repository.GetFallbackRecommendationsAsync(profile.InteractedMovieIds, 5);
            return new BaseResponse<List<RecommendedMovieRes>>
            {
                IsSuccess = true,
                Data = fallback,
                Message = "Popular recommendations"
            };
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
