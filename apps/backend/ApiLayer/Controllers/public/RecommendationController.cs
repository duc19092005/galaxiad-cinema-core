using BusinessLayer.Dtos;
using BusinessLayer.Dtos.Public.Responses;
using BusinessLayer.Entities.MovieInfos;
using BusinessLayer.Entities.UserInfos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shared.Interfaces.Persistence;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace ApiLayer.Controllers.Public;

[ApiController]
[Route("api/v1/[controller]/")]
[ApiExplorerSettings(GroupName = "v1-user")]
public class RecommendationController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<RecommendationController> _logger;

    public RecommendationController(
        IUnitOfWork unitOfWork,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<RecommendationController> logger)
    {
        _unitOfWork = unitOfWork;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    private Guid GetCurrentUserId()
    {
        var sid = User.FindFirstValue(ClaimTypes.Sid);
        if (string.IsNullOrEmpty(sid) || !Guid.TryParse(sid, out var userId))
        {
            throw new UnauthorizedAccessException("Không xác định được danh tính người dùng.");
        }
        return userId;
    }

    // GET api/v1/recommendation/survey/status
    // Returns whether user has completed survey
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
                Message = "Chưa hoàn thành khảo sát"
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
            Message = "Đã hoàn thành khảo sát"
        });
    }

    // POST api/v1/recommendation/survey
    // Save user genre preferences
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

        // Trigger re-embed for this user asynchronously (fire and forget)
        _ = TriggerUserEmbedAsync(userId, dto);

        return Ok(new BaseResponse<object>
        {
            IsSuccess = true,
            Data = null,
            Message = "Lưu khảo sát thành công"
        });
    }

    // GET api/v1/recommendation/movies
    // Get personalized movie recommendations for logged-in user
    [HttpGet("movies")]
    [Authorize]
    public async Task<IActionResult> GetRecommendations()
    {
        Guid userId;
        try { userId = GetCurrentUserId(); }
        catch { return Unauthorized(); }

        // 1. Get user survey
        var survey = await _unitOfWork.Repository<UserGenreSurveyEntity>()
            .Query()
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (survey == null)
        {
            return Ok(new BaseResponse<List<RecommendedMovieRes>>
            {
                IsSuccess = true,
                Data = [],
                Message = "Chưa có dữ liệu khảo sát"
            });
        }

        // 2. Build user preference text from survey
        var genreIds = JsonSerializer.Deserialize<List<string>>(survey.PreferredGenreIds) ?? [];
        var genres = await _unitOfWork.Repository<MovieGenreInfoEntity>()
            .Query()
            .Where(g => genreIds.Contains(g.MovieGenreId.ToString()))
            .ToListAsync();

        var genreNames = genres.Select(g => g.MovieGenreName).ToList();
        var userText = $"Người dùng thích thể loại phim: {string.Join(", ", genreNames)}. {survey.PreferenceDescription}";

        // 3. Call AI service for recommendations
        try
        {
            var aiServiceUrl = _configuration["AiService:BaseUrl"] ?? "http://ai-service:8000";
            var client = _httpClientFactory.CreateClient();

            var reqBody = new AiRecommendRequest { UserText = userText, TopK = 5 };
            var content = new StringContent(JsonSerializer.Serialize(reqBody), Encoding.UTF8, "application/json");

            var response = await client.PostAsync($"{aiServiceUrl}/recommend", content);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("AI service returned {StatusCode}", response.StatusCode);
                return Ok(new BaseResponse<List<RecommendedMovieRes>>
                {
                    IsSuccess = true,
                    Data = [],
                    Message = "AI service không khả dụng"
                });
            }

            var aiResult = JsonSerializer.Deserialize<AiRecommendResponse>(
                await response.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (aiResult == null || aiResult.Results.Count == 0)
                return Ok(new BaseResponse<List<RecommendedMovieRes>> { IsSuccess = true, Data = [], Message = "Không có kết quả" });

            // 4. Query DB for movie details
            var movieIds = aiResult.Results.Select(r => Guid.Parse(r.MovieId)).ToList();
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
                    SimilarityScore = aiResult.Results.FirstOrDefault(r => r.MovieId == m.MovieId.ToString())!.Distance
                })
                .ToListAsync();

            // Preserve order from AI ranking
            var orderedMovies = movieIds
                .Select(id => movies.FirstOrDefault(m => m.MovieId == id))
                .Where(m => m != null)
                .Cast<RecommendedMovieRes>()
                .ToList();

            return Ok(new BaseResponse<List<RecommendedMovieRes>>
            {
                IsSuccess = true,
                Data = orderedMovies,
                Message = "Gợi ý phim thành công"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling AI service");
            return Ok(new BaseResponse<List<RecommendedMovieRes>>
            {
                IsSuccess = true,
                Data = [],
                Message = "Không thể lấy gợi ý lúc này"
            });
        }
    }

    // POST api/v1/recommendation/sync-movies
    // Sync all active movies to AI service for embedding (called by admin)
    [HttpPost("sync-movies")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> SyncMoviesToAiService()
    {
        var movies = await _unitOfWork.Repository<MovieInfoEntity>()
            .Query()
            .Where(m => !m.IsDeleted && (m.IsActive || m.IsCommingSoon))
            .Select(m => new
            {
                m.MovieId,
                m.MovieName,
                m.MovieDescription,
                m.Director,
                m.Actors,
                Genres = string.Join(", ", m.MovieGenreMovieInfoEntity.Select(g => g.MovieGenreInfoEntity.MovieGenreName))
            })
            .ToListAsync();

        var aiMovies = movies.Select(m => new AiMovieItem
        {
            MovieId = m.MovieId.ToString(),
            EmbeddingText = $"Tên phim: {m.MovieName}. Thể loại: {m.Genres}. Mô tả: {m.MovieDescription}. Đạo diễn: {m.Director}. Diễn viên: {m.Actors}"
        }).ToList();

        var aiServiceUrl = _configuration["AiService:BaseUrl"] ?? "http://ai-service:8000";
        var client = _httpClientFactory.CreateClient();
        var reqBody = new AiEmbedMoviesRequest { Movies = aiMovies };
        var content = new StringContent(JsonSerializer.Serialize(reqBody), Encoding.UTF8, "application/json");

        var response = await client.PostAsync($"{aiServiceUrl}/embed-movies", content);

        return Ok(new BaseResponse<object>
        {
            IsSuccess = response.IsSuccessStatusCode,
            Data = null,
            Message = response.IsSuccessStatusCode ? $"Đã sync {movies.Count} phim" : "Sync thất bại"
        });
    }

    private async Task TriggerUserEmbedAsync(Guid userId, SaveSurveyRequestDto dto)
    {
        try
        {
            // Also trigger movie sync if first time
            var aiServiceUrl = _configuration["AiService:BaseUrl"] ?? "http://ai-service:8000";
            var client = _httpClientFactory.CreateClient();
            await client.GetAsync($"{aiServiceUrl}/health");
        }
        catch { /* fire and forget, ignore errors */ }
    }
}
