using System.Net.Http;
using System.Text;
using System.Text.Json;
using Cinema.Application.Dtos.Public.Responses;
using Cinema.Application.Interfaces.IThirdPersonServices;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Cinema.Infrastructure.ExternalServices.Ai;

public class AiRecommendationClient : IAiRecommendationClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AiRecommendationClient> _logger;

    public AiRecommendationClient(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<AiRecommendationClient> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<AiRecommendResponse?> RecommendAsync(AiRecommendRequest request, CancellationToken cancellationToken = default)
    {
        var aiServiceUrl = _configuration["AiService:BaseUrl"] ?? "http://cinema-ai-service:8000";
        return await PostAiAsync<AiRecommendRequest, AiRecommendResponse>($"{aiServiceUrl}/recommend", request, cancellationToken);
    }

    public async Task<AiRecommendResponse?> RecommendByIdAsync(AiRecommendByIdRequest request, CancellationToken cancellationToken = default)
    {
        var aiServiceUrl = _configuration["AiService:BaseUrl"] ?? "http://cinema-ai-service:8000";
        return await PostAiAsync<AiRecommendByIdRequest, AiRecommendResponse>($"{aiServiceUrl}/recommend-by-id", request, cancellationToken);
    }

    private async Task<TResponse?> PostAiAsync<TRequest, TResponse>(string url, TRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");
            var response = await client.PostAsync(url, content, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("AI service returned {StatusCode} for {Url}", response.StatusCode, url);
                return default;
            }

            return JsonSerializer.Deserialize<TResponse>(
                await response.Content.ReadAsStringAsync(cancellationToken),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to call AI service at {Url}", url);
            return default;
        }
    }
}
