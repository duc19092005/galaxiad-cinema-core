using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Domain.Entities.MovieInfos;
using Cinema.Application.Interfaces.Comments;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

using Cinema.Application.Interfaces.IThirdPersonServices;

namespace Cinema.Infrastructure.BackgroundJobs;

public class AiMovieEmbeddingSyncService : IAiMovieEmbeddingSyncService
{
    private readonly IRecommendationRepository _repository;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AiMovieEmbeddingSyncService> _logger;

    private static DateTime _lastSyncTime = DateTime.MinValue;
    private static readonly TimeSpan SyncInterval = TimeSpan.FromMinutes(10);

    public AiMovieEmbeddingSyncService(
        IRecommendationRepository repository,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<AiMovieEmbeddingSyncService> logger)
    {
        _repository = repository;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<AiMovieEmbeddingSyncResultDto> EnsureMoviesSyncedAsync(CancellationToken cancellationToken = default)
    {
        if (DateTime.UtcNow - _lastSyncTime < SyncInterval)
        {
            return new AiMovieEmbeddingSyncResultDto
            {
                IsSuccess = true,
                MovieCount = 0,
                Message = "Skipped sync (recently synced)"
            };
        }

        var result = await SyncAllActiveMoviesAsync(cancellationToken);
        if (result.IsSuccess)
        {
            _lastSyncTime = DateTime.UtcNow;
        }
        return result;
    }

    public async Task<AiMovieEmbeddingSyncResultDto> SyncAllActiveMoviesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var aiMovies = await _repository.GetActiveMoviesForEmbeddingAsync(cancellationToken);
            return await PostMoviesAsync("sync-movies", aiMovies, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing all movies to AI service");
            return new AiMovieEmbeddingSyncResultDto
            {
                IsSuccess = false,
                Message = "Sync movies to AI service failed"
            };
        }
    }

    public async Task<AiMovieEmbeddingSyncResultDto> SyncMovieAsync(Guid movieId, CancellationToken cancellationToken = default)
    {
        try
        {
            var aiMovie = await _repository.GetMovieForEmbeddingAsync(movieId, cancellationToken);

            if (aiMovie == null)
            {
                return await DeleteMovieAsync(movieId, cancellationToken);
            }

            return await PostMoviesAsync("embed-movies", [aiMovie], cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error syncing movie {MovieId} to AI service", movieId);
            return new AiMovieEmbeddingSyncResultDto
            {
                IsSuccess = false,
                Message = "Sync movie to AI service failed"
            };
        }
    }

    public async Task<AiMovieEmbeddingSyncResultDto> DeleteMovieAsync(Guid movieId, CancellationToken cancellationToken = default)
    {
        try
        {
            var client = CreateClient();
            var response = await client.DeleteAsync($"{GetAiServiceUrl()}/embed-movies/{movieId}", cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Deleted movie {MovieId} embedding from AI service", movieId);
                return new AiMovieEmbeddingSyncResultDto
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

            return new AiMovieEmbeddingSyncResultDto
            {
                IsSuccess = false,
                Message = "AI service rejected movie delete"
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error deleting movie {MovieId} from AI service", movieId);
            return new AiMovieEmbeddingSyncResultDto
            {
                IsSuccess = false,
                Message = "Delete movie from AI service failed"
            };
        }
    }

    private async Task<AiMovieEmbeddingSyncResultDto> PostMoviesAsync(string endpoint, List<AiMovieItem> movies, CancellationToken cancellationToken)
    {
        if (movies.Count == 0 && endpoint != "sync-movies")
        {
            return new AiMovieEmbeddingSyncResultDto
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
            return new AiMovieEmbeddingSyncResultDto
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

        return new AiMovieEmbeddingSyncResultDto
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
        return _configuration["AiService:BaseUrl"] ?? "http://cinema-ai-service:8000";
    }
}
