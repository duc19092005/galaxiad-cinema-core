using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.Chatbot;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Cinema.Infrastructure.Services;

/// <summary>
/// HTTP client gọi Python AI Service /recommend endpoint cho semantic movie search trong chatbot.
/// </summary>
public class AiSemanticSearchClient : IAiSemanticSearchClient
{
    private readonly IConfiguration                      _configuration;
    private readonly ILogger<AiSemanticSearchClient>     _logger;
    private static readonly HttpClient HttpClient = new();

    public AiSemanticSearchClient(
        IConfiguration                  configuration,
        ILogger<AiSemanticSearchClient> logger)
    {
        _configuration = configuration;
        _logger        = logger;
    }

    public async Task<List<AiMovieScore>> RecommendAsync(string queryText, int topK = 10)
    {
        var aiServiceUrl = _configuration["AiService:BaseUrl"]?.TrimEnd('/') ?? "http://cinema-ai-service:8000";

        try
        {
            var payload = new RecommendRequest { UserText = queryText, TopK = topK };
            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            using var response = await HttpClient.PostAsync($"{aiServiceUrl}/recommend", content);
            response.EnsureSuccessStatusCode();

            var responseText = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<RecommendResponse>(
                responseText,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (result?.Results == null || result.Results.Count == 0)
                return [];

            return result.Results
                .Select(r => new AiMovieScore(r.MovieId, r.Distance))
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to call Python AI service /recommend. Returning empty results.");
            return [];
        }
    }

    private sealed class RecommendRequest
    {
        [JsonPropertyName("user_text")]
        public string UserText { get; init; } = string.Empty;

        [JsonPropertyName("top_k")]
        public int TopK { get; init; } = 10;
    }

    private sealed class RecommendResponse
    {
        [JsonPropertyName("results")]
        public List<RecommendItem> Results { get; init; } = [];
    }

    private sealed class RecommendItem
    {
        [JsonPropertyName("movie_id")]
        public string MovieId { get; init; } = string.Empty;

        [JsonPropertyName("distance")]
        public double Distance { get; init; }
    }
}
