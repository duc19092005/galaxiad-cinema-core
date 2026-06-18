using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BusinessLayer.Services.Comments;

public record CommentModerationResult(bool Blocked, string Reason);

public class DeepSeekModerationService
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
        var apiKey = _configuration["DeepSeek:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return new CommentModerationResult(false, "DeepSeek API key is not configured.");
        }

        try
        {
            var baseUrl = _configuration["DeepSeek:BaseUrl"]?.TrimEnd('/') ?? "https://api.deepseek.com";
            var model = _configuration["DeepSeek:Model"] ?? "deepseek-chat";

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/chat/completions");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var payload = new
            {
                model,
                temperature = 0,
                messages = new[]
                {
                    new
                    {
                        role = "system",
                        content = "You moderate Vietnamese cinema comments. Return only JSON: {\"blocked\":true|false,\"reason\":\"short Vietnamese reason\"}. Block only severe insults, hate, threats, sexual harassment, or abusive profanity. Do not block normal negative movie opinions."
                    },
                    new
                    {
                        role = "user",
                        content
                    }
                }
            };

            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            using var response = await HttpClient.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();

            var responseText = await response.Content.ReadAsStringAsync(cancellationToken);
            using var doc = JsonDocument.Parse(responseText);
            var moderationText = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "{}";

            var jsonStart = moderationText.IndexOf('{');
            var jsonEnd = moderationText.LastIndexOf('}');
            if (jsonStart >= 0 && jsonEnd >= jsonStart)
            {
                moderationText = moderationText[jsonStart..(jsonEnd + 1)];
            }

            using var moderationDoc = JsonDocument.Parse(moderationText);
            var blocked = moderationDoc.RootElement.TryGetProperty("blocked", out var blockedProp) && blockedProp.GetBoolean();
            var reason = moderationDoc.RootElement.TryGetProperty("reason", out var reasonProp)
                ? reasonProp.GetString() ?? "Bình luận vi phạm tiêu chuẩn cộng đồng."
                : "Bình luận vi phạm tiêu chuẩn cộng đồng.";

            return new CommentModerationResult(blocked, reason);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "DeepSeek moderation failed. Comment will remain visible to avoid blocking customer flow.");
            return new CommentModerationResult(false, "Moderation service unavailable.");
        }
    }
}

