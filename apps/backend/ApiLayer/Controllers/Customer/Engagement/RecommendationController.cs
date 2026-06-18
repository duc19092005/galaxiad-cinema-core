using System.Security.Claims;
using System.Text;
using System.Text.Json;
using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Public.Responses;
using BusinessLayer.Entities.MovieInfos;
using BusinessLayer.Entities.UserInfos;
using BusinessLayer.Services.ApplicationServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shared.Enums;
using Shared.Interfaces.Persistence;

namespace ApiLayer.Controllers.Customer.Engagement;

[ApiController]
[Route("api/v1/[controller]/")]
[ApiExplorerSettings(GroupName = "v1-user")]
public class RecommendationController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<RecommendationController> _logger;
    private readonly AiMovieEmbeddingSyncService _aiMovieEmbeddingSyncService;

    public RecommendationController(
        IUnitOfWork unitOfWork,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<RecommendationController> logger,
        AiMovieEmbeddingSyncService aiMovieEmbeddingSyncService)
    {
        _unitOfWork = unitOfWork;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
        _aiMovieEmbeddingSyncService = aiMovieEmbeddingSyncService;
    }

    private Guid GetCurrentUserId()
    {
        var sid = User.FindFirstValue(ClaimTypes.Sid);
        if (string.IsNullOrEmpty(sid) || !Guid.TryParse(sid, out var userId))
        {
            throw new UnauthorizedAccessException("Cannot determine current user.");
        }

        return userId;
    }

    [HttpGet("survey/status")]
    [Authorize]
    public async Task<IActionResult> GetSurveyStatus()
    {
        Guid userId;
        try { userId = GetCurrentUserId(); }
        catch { return Unauthorized(); }

        var survey = await _unitOfWork.Repository<UserGenreSurveyEntity>()
            .Query()
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (survey == null)
        {
            return Ok(new BaseResponse<SurveyStatusRes>
            {
                IsSuccess = true,
                Data = new SurveyStatusRes { HasCompletedSurvey = false },
                Message = "Survey not completed"
            });
        }

        var genreIds = JsonSerializer.Deserialize<List<string>>(survey.PreferredGenreIds) ?? [];

        return Ok(new BaseResponse<SurveyStatusRes>
        {
            IsSuccess = true,
            Data = new SurveyStatusRes
            {
                HasCompletedSurvey = true,
                PreferredGenreIds = genreIds,
                PreferenceDescription = survey.PreferenceDescription
            },
            Message = "Survey completed"
        });
    }

    [HttpPost("survey")]
    [Authorize]
    public async Task<IActionResult> SaveSurvey([FromBody] SaveSurveyRequestDto dto)
    {
        Guid userId;
        try { userId = GetCurrentUserId(); }
        catch { return Unauthorized(); }

        var existingSurvey = await _unitOfWork.Repository<UserGenreSurveyEntity>()
            .Query()
            .FirstOrDefaultAsync(x => x.UserId == userId);

        var genreIdsJson = JsonSerializer.Serialize(dto.PreferredGenreIds.Select(g => g.ToString()));

        if (existingSurvey != null)
        {
            existingSurvey.PreferredGenreIds = genreIdsJson;
            existingSurvey.PreferenceDescription = dto.PreferenceDescription;
            existingSurvey.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Repository<UserGenreSurveyEntity>().Update(existingSurvey);
        }
        else
        {
            var survey = new UserGenreSurveyEntity
            {
                SurveyId = Guid.NewGuid(),
                UserId = userId,
                PreferredGenreIds = genreIdsJson,
                PreferenceDescription = dto.PreferenceDescription,
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.Repository<UserGenreSurveyEntity>().AddAsync(survey);
        }

        await _unitOfWork.SaveChangesAsync();

        return Ok(new BaseResponse<object>
        {
            IsSuccess = true,
            Data = null,
            Message = "Saved recommendation preferences"
        });
    }

    [HttpGet("movies")]
    [Authorize]
    public async Task<IActionResult> GetRecommendations()
    {
        Guid userId;
        try { userId = GetCurrentUserId(); }
        catch { return Unauthorized(); }

        var survey = await _unitOfWork.Repository<UserGenreSurveyEntity>()
            .Query()
            .FirstOrDefaultAsync(x => x.UserId == userId);

        var profile = await BuildUserBehaviorProfileAsync(userId, survey);
        if (string.IsNullOrWhiteSpace(profile.UserText))
        {
            var fallback = await GetFallbackRecommendationsAsync(profile.InteractedMovieIds, 5);
            return Ok(new BaseResponse<List<RecommendedMovieRes>>
            {
                IsSuccess = true,
                Data = fallback,
                Message = "Popular recommendations"
            });
        }

        try
        {
            await _aiMovieEmbeddingSyncService.EnsureMoviesSyncedAsync(HttpContext.RequestAborted);

            var aiServiceUrl = _configuration["AiService:BaseUrl"] ?? "http://ai-service:8000";
            var client = _httpClientFactory.CreateClient();

            var reqBody = new AiRecommendRequest { UserText = profile.UserText, TopK = 12 };
            var content = new StringContent(JsonSerializer.Serialize(reqBody), Encoding.UTF8, "application/json");

            var response = await client.PostAsync($"{aiServiceUrl}/recommend", content);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("AI service returned {StatusCode}", response.StatusCode);
                var fallback = await GetFallbackRecommendationsAsync(profile.InteractedMovieIds, 5);
                return Ok(new BaseResponse<List<RecommendedMovieRes>>
                {
                    IsSuccess = true,
                    Data = fallback,
                    Message = "Popular recommendations"
                });
            }

            var aiResult = JsonSerializer.Deserialize<AiRecommendResponse>(
                await response.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (aiResult == null || aiResult.Results.Count == 0)
            {
                var fallback = await GetFallbackRecommendationsAsync(profile.InteractedMovieIds, 5);
                return Ok(new BaseResponse<List<RecommendedMovieRes>>
                {
                    IsSuccess = true,
                    Data = fallback,
                    Message = "Popular recommendations"
                });
            }

            var movieIds = aiResult.Results
                .Select(r => Guid.TryParse(r.MovieId, out var id) ? id : Guid.Empty)
                .Where(id => id != Guid.Empty && !profile.InteractedMovieIds.Contains(id))
                .Distinct()
                .ToList();

            var movies = await LoadRecommendedMoviesAsync(movieIds, aiResult.Results);

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
                var fallback = await GetFallbackRecommendationsAsync(excludeIds, 5 - orderedMovies.Count);
                orderedMovies.AddRange(fallback);
            }

            return Ok(new BaseResponse<List<RecommendedMovieRes>>
            {
                IsSuccess = true,
                Data = orderedMovies,
                Message = "Behavior-based recommendations"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling AI service");
            var fallback = await GetFallbackRecommendationsAsync(profile.InteractedMovieIds, 5);
            return Ok(new BaseResponse<List<RecommendedMovieRes>>
            {
                IsSuccess = true,
                Data = fallback,
                Message = "Popular recommendations"
            });
        }
    }

    [HttpPost("sync-movies")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> SyncMoviesToAiService()
    {
        var result = await _aiMovieEmbeddingSyncService.SyncAllActiveMoviesAsync(HttpContext.RequestAborted);

        return Ok(new BaseResponse<object>
        {
            IsSuccess = result.IsSuccess,
            Data = null,
            Message = result.IsSuccess ? $"Synced {result.MovieCount} movies" : "Sync failed"
        });
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
        if (survey == null)
        {
            return;
        }

        var genreIds = JsonSerializer.Deserialize<List<string>>(survey.PreferredGenreIds) ?? [];
        var genres = await _unitOfWork.Repository<MovieGenreInfoEntity>()
            .Query()
            .Where(g => genreIds.Contains(g.MovieGenreId.ToString()))
            .Select(g => g.MovieGenreName)
            .ToListAsync();

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
        var signals = await _unitOfWork.Repository<MovieViewEntity>().Query()
            .Where(x => x.UserId == userId)
            .GroupBy(x => x.MovieId)
            .Select(x => new MovieBehaviorSignal(x.Key, x.Count(), x.Max(v => v.ViewedAt)))
            .OrderByDescending(x => x.Count)
            .ThenByDescending(x => x.LastAt)
            .Take(8)
            .ToListAsync();

        AddSignals(interactedMovieIds, signals);
        var snippets = await LoadMoviePreferenceSnippetsAsync(signals.Select(x => x.MovieId));
        if (snippets.Count > 0)
        {
            textParts.Add($"User often views/clicks movies: {string.Join("; ", snippets)}");
        }
    }

    private async Task AddBookedMovieSignalsAsync(Guid userId, List<string> textParts, HashSet<Guid> interactedMovieIds)
    {
        var signals = await _unitOfWork.Repository<OrderDetailsInfo>().Query()
            .Where(x => x.OrderInfoEntity.UserId == userId
                        && (x.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked
                            || x.OrderInfoEntity.OrderStatus == OrderStatusEnum.Completed))
            .GroupBy(x => x.MovieScheduleInfoEntity.MovieId)
            .Select(x => new MovieBehaviorSignal(x.Key, x.Count(), x.Max(d => d.OrderInfoEntity.OrderDate)))
            .OrderByDescending(x => x.Count)
            .ThenByDescending(x => x.LastAt)
            .Take(8)
            .ToListAsync();

        AddSignals(interactedMovieIds, signals);
        var snippets = await LoadMoviePreferenceSnippetsAsync(signals.Select(x => x.MovieId));
        if (snippets.Count > 0)
        {
            textParts.Add($"User has booked tickets for movies: {string.Join("; ", snippets)}");
        }
    }

    private async Task AddPositiveRatingSignalsAsync(Guid userId, List<string> textParts, HashSet<Guid> interactedMovieIds)
    {
        var signals = await _unitOfWork.Repository<MovieCommentEntity>().Query()
            .Where(x => x.UserId == userId
                        && x.ParentCommentId == null
                        && x.Rating.HasValue
                        && x.Rating.Value >= 4
                        && x.Status != MovieCommentStatusEnum.Deleted
                        && x.Status != MovieCommentStatusEnum.Rejected)
            .GroupBy(x => x.MovieId)
            .Select(x => new MovieBehaviorSignal(x.Key, x.Count(), x.Max(c => c.CreatedAt)))
            .OrderByDescending(x => x.Count)
            .ThenByDescending(x => x.LastAt)
            .Take(8)
            .ToListAsync();

        AddSignals(interactedMovieIds, signals);
        var snippets = await LoadMoviePreferenceSnippetsAsync(signals.Select(x => x.MovieId));
        if (snippets.Count > 0)
        {
            textParts.Add($"User rated these movies highly: {string.Join("; ", snippets)}");
        }
    }

    private async Task<List<string>> LoadMoviePreferenceSnippetsAsync(IEnumerable<Guid> movieIds)
    {
        var ids = movieIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return [];
        }

        var movies = await _unitOfWork.Repository<MovieInfoEntity>()
            .Query()
            .Include(m => m.MovieGenreMovieInfoEntity)
            .ThenInclude(g => g.MovieGenreInfoEntity)
            .AsNoTracking()
            .Where(m => ids.Contains(m.MovieId) && !m.IsDeleted)
            .ToListAsync();

        return movies
            .Select(m => $"Movie: {m.MovieName}; genres: {string.Join(", ", m.MovieGenreMovieInfoEntity.Select(g => g.MovieGenreInfoEntity.MovieGenreName))}; director: {m.Director}; actors: {m.Actors}")
            .ToList();
    }

    private async Task<List<RecommendedMovieRes>> LoadRecommendedMoviesAsync(List<Guid> movieIds, List<AiMovieScore> scores)
    {
        var scoreByMovieId = scores
            .Where(score => Guid.TryParse(score.MovieId, out _))
            .ToDictionary(score => Guid.Parse(score.MovieId), score => score.Distance);

        var movies = await _unitOfWork.Repository<MovieInfoEntity>()
            .Query()
            .Where(m => movieIds.Contains(m.MovieId) && !m.IsDeleted && (m.IsActive || m.IsCommingSoon))
            .Select(m => new RecommendedMovieRes
            {
                MovieId = m.MovieId,
                MovieName = m.MovieName,
                MoviePosterURL = m.MovieImageUrl,
                MovieBannerURL = m.MovieBannerUrl,
                MovieDescription = m.MovieDescription,
                MovieGenres = string.Join(", ", m.MovieGenreMovieInfoEntity.Select(g => g.MovieGenreInfoEntity.MovieGenreName)),
                MovieFormatInfos = string.Join(", ", m.MovieFormatMovieInfoEntity.Select(f => f.MovieFormatInfoEntity.MovieFormatName)),
                MovieRequiredAge = m.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.TrimEnd().TrimStart(),
                MovieDuration = m.MovieDuration,
                IsCommingSoon = m.IsCommingSoon,
                SimilarityScore = 0
            })
            .ToListAsync();

        foreach (var movie in movies)
        {
            movie.SimilarityScore = scoreByMovieId.GetValueOrDefault(movie.MovieId);
        }

        return movies;
    }

    private async Task<List<RecommendedMovieRes>> GetFallbackRecommendationsAsync(HashSet<Guid> excludedMovieIds, int take)
    {
        if (take <= 0)
        {
            return [];
        }

        var excludedIds = excludedMovieIds.ToList();
        var movies = await _unitOfWork.Repository<MovieInfoEntity>()
            .Query()
            .Where(m => !m.IsDeleted
                        && (m.IsActive || m.IsCommingSoon)
                        && !excludedIds.Contains(m.MovieId))
            .Select(m => new RecommendedMovieRes
            {
                MovieId = m.MovieId,
                MovieName = m.MovieName,
                MoviePosterURL = m.MovieImageUrl,
                MovieBannerURL = m.MovieBannerUrl,
                MovieDescription = m.MovieDescription,
                MovieGenres = string.Join(", ", m.MovieGenreMovieInfoEntity.Select(g => g.MovieGenreInfoEntity.MovieGenreName)),
                MovieFormatInfos = string.Join(", ", m.MovieFormatMovieInfoEntity.Select(f => f.MovieFormatInfoEntity.MovieFormatName)),
                MovieRequiredAge = m.MovieRequiredAgeEntity.MovieRequiredAgeSymbol.TrimEnd().TrimStart(),
                MovieDuration = m.MovieDuration,
                IsCommingSoon = m.IsCommingSoon,
                SimilarityScore = 0
            })
            .ToListAsync();

        var since = DateTime.UtcNow.AddDays(-30);
        var viewCounts = await _unitOfWork.Repository<MovieViewEntity>().Query()
            .Where(x => x.ViewedAt >= since)
            .GroupBy(x => x.MovieId)
            .Select(x => new { MovieId = x.Key, Count = x.Count() })
            .ToDictionaryAsync(x => x.MovieId, x => x.Count);

        var bookingCounts = await _unitOfWork.Repository<OrderDetailsInfo>().Query()
            .Where(x => x.OrderInfoEntity.OrderDate >= since
                        && (x.OrderInfoEntity.OrderStatus == OrderStatusEnum.Booked
                            || x.OrderInfoEntity.OrderStatus == OrderStatusEnum.Completed))
            .GroupBy(x => x.MovieScheduleInfoEntity.MovieId)
            .Select(x => new { MovieId = x.Key, Count = x.Count() })
            .ToDictionaryAsync(x => x.MovieId, x => x.Count);

        var ratingScores = await _unitOfWork.Repository<MovieCommentEntity>().Query()
            .Where(x => x.ParentCommentId == null
                        && x.Rating.HasValue
                        && x.Status == MovieCommentStatusEnum.Visible)
            .GroupBy(x => x.MovieId)
            .Select(x => new { MovieId = x.Key, Average = x.Average(c => c.Rating!.Value), Count = x.Count() })
            .ToDictionaryAsync(x => x.MovieId, x => new { x.Average, x.Count });

        return movies
            .Select(movie =>
            {
                var rating = ratingScores.GetValueOrDefault(movie.MovieId);
                movie.SimilarityScore =
                    bookingCounts.GetValueOrDefault(movie.MovieId) * 3
                    + viewCounts.GetValueOrDefault(movie.MovieId)
                    + (rating?.Average ?? 0) * 10
                    + (rating?.Count ?? 0);
                return movie;
            })
            .OrderByDescending(movie => movie.SimilarityScore)
            .ThenBy(movie => movie.IsCommingSoon)
            .Take(take)
            .ToList();
    }

    private static void AddSignals(HashSet<Guid> target, IEnumerable<MovieBehaviorSignal> signals)
    {
        foreach (var signal in signals)
        {
            target.Add(signal.MovieId);
        }
    }

    private sealed record MovieBehaviorSignal(Guid MovieId, int Count, DateTime LastAt);

    private sealed record UserBehaviorProfile(string UserText, HashSet<Guid> InteractedMovieIds);
}
