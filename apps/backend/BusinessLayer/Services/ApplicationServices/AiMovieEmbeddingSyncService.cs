using System.Net.Http.Json;
using System.Text.Json;
using BusinessLayer.Dtos.Public.Responses;
using BusinessLayer.Entities.MovieInfos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared.Interfaces.Persistence;

namespace BusinessLayer.Services.ApplicationServices;

public class AiMovieEmbeddingSyncResult
{
    public bool IsSuccess { get; set; }
    public int MovieCount { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class AiMovieEmbeddingSyncService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AiMovieEmbeddingSyncService> _logger;

    public AiMovieEmbeddingSyncService(
        IUnitOfWork unitOfWork,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<AiMovieEmbeddingSyncService> logger)
    {
        _unitOfWork = unitOfWork;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<AiMovieEmbeddingSyncResult> EnsureMoviesSyncedAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var client = CreateClient();
            var response = await client.GetAsync($"{GetAiServiceUrl()}/health", cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
                using var health = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
                if (health.RootElement.TryGetProperty("embedded_movies_count", out var countElement)
                    && countElement.GetInt32() > 0)
                {
                    return new AiMovieEmbeddingSyncResult
                    {
                        IsSuccess = true,
                        MovieCount = countElement.GetInt32(),
                        Message = "AI movie index already available"
                    };
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not check AI movie embedding health. Trying full sync.");
        }

        return await SyncAllActiveMoviesAsync(cancellationToken);
    }

    public async Task<AiMovieEmbeddingSyncResult> SyncAllActiveMoviesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var movies = await QueryMoviesForEmbedding()
                .Where(m => !m.IsDeleted && (m.IsActive || m.IsCommingSoon))
                .ToListAsync(cancellationToken);

            var aiMovies = movies.Select(BuildAiMovieItem).ToList();
            return await PostMoviesAsync("sync-movies", aiMovies, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing all movies to AI service");
            return new AiMovieEmbeddingSyncResult
            {
                IsSuccess = false,
                Message = "Sync movies to AI service failed"
            };
        }
    }

    public async Task<AiMovieEmbeddingSyncResult> SyncMovieAsync(Guid movieId, CancellationToken cancellationToken = default)
    {
        try
        {
            var movie = await QueryMoviesForEmbedding()
                .Where(m => m.MovieId == movieId)
                .FirstOrDefaultAsync(cancellationToken);

            if (movie == null || movie.IsDeleted || (!movie.IsActive && !movie.IsCommingSoon))
            {
                return await DeleteMovieAsync(movieId, cancellationToken);
            }

            return await PostMoviesAsync("embed-movies", [BuildAiMovieItem(movie)], cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error syncing movie {MovieId} to AI service", movieId);
            return new AiMovieEmbeddingSyncResult
            {
                IsSuccess = false,
                Message = "Sync movie to AI service failed"
            };
        }
    }

    public async Task<AiMovieEmbeddingSyncResult> DeleteMovieAsync(Guid movieId, CancellationToken cancellationToken = default)
    {
        try
        {
            var client = CreateClient();
            var response = await client.DeleteAsync($"{GetAiServiceUrl()}/embed-movies/{movieId}", cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Deleted movie {MovieId} embedding from AI service", movieId);
                return new AiMovieEmbeddingSyncResult
                {
                    IsSuccess = true,
                    MovieCount = 0,
                    Message = "Deleted movie embedding"
                };
            }

            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning(
                "AI movie delete failed for {MovieId} with status {StatusCode}: {ErrorBody}",
                movieId,
                response.StatusCode,
                errorBody);

            return new AiMovieEmbeddingSyncResult
            {
                IsSuccess = false,
                Message = "AI service rejected movie delete"
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error deleting movie {MovieId} from AI service", movieId);
            return new AiMovieEmbeddingSyncResult
            {
                IsSuccess = false,
                Message = "Delete movie from AI service failed"
            };
        }
    }

    private IQueryable<MovieInfoEntity> QueryMoviesForEmbedding()
    {
        return _unitOfWork.Repository<MovieInfoEntity>()
            .Query()
            .Include(m => m.MovieGenreMovieInfoEntity)
            .ThenInclude(g => g.MovieGenreInfoEntity);
    }

    private static AiMovieItem BuildAiMovieItem(MovieInfoEntity movie)
    {
        var genres = string.Join(", ", movie.MovieGenreMovieInfoEntity
            .Select(g => g.MovieGenreInfoEntity.MovieGenreName));

        return new AiMovieItem
        {
            MovieId = movie.MovieId.ToString(),
            EmbeddingText = $"Tên phim: {movie.MovieName}. Thể loại: {genres}. Mô tả: {movie.MovieDescription}. Đạo diễn: {movie.Director}. Diễn viên: {movie.Actors}"
        };
    }

    private async Task<AiMovieEmbeddingSyncResult> PostMoviesAsync(string endpoint, List<AiMovieItem> movies, CancellationToken cancellationToken)
    {
        if (movies.Count == 0 && endpoint != "sync-movies")
        {
            return new AiMovieEmbeddingSyncResult
            {
                IsSuccess = true,
                MovieCount = 0,
                Message = "No active movies to sync"
            };
        }

        var client = CreateClient();
        var response = await client.PostAsJsonAsync(
            $"{GetAiServiceUrl()}/{endpoint}",
            new AiEmbedMoviesRequest { Movies = movies },
            cancellationToken);

        if (response.IsSuccessStatusCode)
        {
            _logger.LogInformation("Synced {MovieCount} movies to AI service", movies.Count);
            return new AiMovieEmbeddingSyncResult
            {
                IsSuccess = true,
                MovieCount = movies.Count,
                Message = $"Synced {movies.Count} movies"
            };
        }

        var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
        _logger.LogWarning(
            "AI movie sync failed with status {StatusCode}: {ErrorBody}",
            response.StatusCode,
            errorBody);

        return new AiMovieEmbeddingSyncResult
        {
            IsSuccess = false,
            MovieCount = movies.Count,
            Message = "AI service rejected movie sync"
        };
    }

    private HttpClient CreateClient()
    {
        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(10);
        return client;
    }

    private string GetAiServiceUrl()
    {
        return _configuration["AiService:BaseUrl"] ?? "http://ai-service:8000";
    }
}
