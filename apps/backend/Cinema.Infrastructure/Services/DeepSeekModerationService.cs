using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Cinema.Application.Interfaces.Comments;

namespace Cinema.Infrastructure.Services;

public class DeepSeekModerationService : ICommentModerationService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<DeepSeekModerationService> _logger;
    private static readonly HttpClient HttpClient = new();

    public DeepSeekModerationService(
        IConfiguration configuration,
        ILogger<DeepSeekModerationService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<CommentModerationResult> ModerateAsync(string content, CancellationToken cancellationToken = default)
    {
        var aiServiceUrl = _configuration["AiService:BaseUrl"]?.TrimEnd('/') ?? "http://cinema-ai-service:8000";

        try
        {
            var payload = new ModerationRequest { Content = content };
            var requestContent = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            using var response = await HttpClient.PostAsync($"{aiServiceUrl}/moderate", requestContent, cancellationToken);
            response.EnsureSuccessStatusCode();

            var responseText = await response.Content.ReadAsStringAsync(cancellationToken);
            var result = JsonSerializer.Deserialize<ModerationResponse>(responseText);

            if (result == null)
            {
                return new CommentModerationResult(false, "Bình luận không vi phạm.");
            }

            return new CommentModerationResult(result.Blocked, result.Reason);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to call Python AI service moderation endpoint at {Url}. Comment will remain visible to avoid blocking customer flow.", aiServiceUrl);
            return new CommentModerationResult(false, "Moderation service unavailable.");
        }
    }

    private sealed class ModerationRequest
    {
        [JsonPropertyName("content")]
        public string Content { get; init; } = string.Empty;
    }

    private sealed class ModerationResponse
    {
        [JsonPropertyName("blocked")]
        public bool Blocked { get; init; }

        [JsonPropertyName("reason")]
        public string Reason { get; init; } = string.Empty;
    }
}
