using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Domain.Localization;

namespace Cinema.Infrastructure.Services;

public class DeepSeekChatLlmClient : IChatLlmClient
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<DeepSeekChatLlmClient> _logger;
    private readonly ILocalizationService _localizationService;
    private static readonly HttpClient HttpClient = new();

    public DeepSeekChatLlmClient(
        IConfiguration configuration,
        ILogger<DeepSeekChatLlmClient> logger,
        ILocalizationService localizationService)
    {
        _configuration = configuration;
        _logger = logger;
        _localizationService = localizationService;
    }

    public async Task<string> SendChatRequestAsync(string userPrompt, string toolContext, string userRole, string userId)
    {
        var aiServiceUrl = _configuration["AiService:BaseUrl"]?.TrimEnd('/') ?? "http://cinema-ai-service:8000";

        try
        {
            var payload = new ChatRequest
            {
                UserPrompt = userPrompt,
                ToolContext = toolContext,
                UserRole = userRole,
                UserId = userId,
                Language = _localizationService.CurrentLanguage
            };

            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            using var response = await HttpClient.PostAsync($"{aiServiceUrl}/chat", content);
            response.EnsureSuccessStatusCode();

            var responseText = await response.Content.ReadAsStringAsync();
            var chatResult = JsonSerializer.Deserialize<ChatResponse>(responseText);

            return chatResult?.Response ?? string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to call Python AI service chat endpoint at {Url}.", aiServiceUrl);
            throw;
        }
    }

    public async IAsyncEnumerable<string> StreamChatRequestAsync(
        string userPrompt,
        string toolContext,
        string userRole,
        string userId,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var aiServiceUrl = _configuration["AiService:BaseUrl"]?.TrimEnd('/') ?? "http://cinema-ai-service:8000";

        var payload = new ChatRequest
        {
            UserPrompt = userPrompt,
            ToolContext = toolContext,
            UserRole = userRole,
            UserId = userId,
            Language = _localizationService.CurrentLanguage
        };

        var request = new HttpRequestMessage(HttpMethod.Post, $"{aiServiceUrl}/chat/stream")
        {
            Content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            )
        };
        request.Headers.Accept.ParseAdd("text/event-stream");

        using var response = await HttpClient.SendAsync(
            request,
            HttpCompletionOption.ResponseHeadersRead,
            cancellationToken);

        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var reader = new System.IO.StreamReader(stream, Encoding.UTF8);

        string? eventName = null;
        var dataBuilder = new StringBuilder();

        while (!reader.EndOfStream && !cancellationToken.IsCancellationRequested)
        {
            var line = await reader.ReadLineAsync(cancellationToken);
            if (line is null) break;

            if (string.IsNullOrWhiteSpace(line))
            {
                if (dataBuilder.Length > 0)
                {
                    var data = dataBuilder.ToString();
                    dataBuilder.Clear();

                    if (string.Equals(eventName, "token", StringComparison.OrdinalIgnoreCase))
                    {
                        var token = ExtractToken(data);
                        if (!string.IsNullOrEmpty(token))
                        {
                            yield return token;
                        }
                    }
                    else if (string.Equals(eventName, "error", StringComparison.OrdinalIgnoreCase))
                    {
                        throw new InvalidOperationException(ExtractErrorMessage(data));
                    }
                }

                eventName = null;
                continue;
            }

            if (line.StartsWith("event:", StringComparison.OrdinalIgnoreCase))
            {
                eventName = line["event:".Length..].Trim();
            }
            else if (line.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            {
                if (dataBuilder.Length > 0) dataBuilder.AppendLine();
                dataBuilder.Append(line["data:".Length..].TrimStart());
            }
        }
    }

    public async Task<ChatGuardResult> CheckMessageSafetyAsync(string message)
    {
        var aiServiceUrl = _configuration["AiService:BaseUrl"]?.TrimEnd('/') ?? "http://cinema-ai-service:8000";

        try
        {
            var payload = new GuardRequest 
            { 
                Message = message,
                Language = _localizationService.CurrentLanguage
            };
            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            using var response = await HttpClient.PostAsync($"{aiServiceUrl}/guard", content);
            response.EnsureSuccessStatusCode();

            var responseText = await response.Content.ReadAsStringAsync();
            var guardResult  = JsonSerializer.Deserialize<GuardResponse>(responseText);

            return new ChatGuardResult(
                IsBlocked: guardResult?.IsBlocked ?? false,
                Reason:    guardResult?.Reason    ?? string.Empty
            );
        }
        catch (Exception ex)
        {
            // Fail-open: nếu không gọi được /guard, cho qua — tránh block nhầm người dùng hợp lệ
            _logger.LogWarning(ex, "Guard check failed for message. Failing open.");
            return new ChatGuardResult(IsBlocked: false, Reason: string.Empty);
        }
    }

    private static string ExtractToken(string data)
    {
        try
        {
            using var doc = JsonDocument.Parse(data);
            return doc.RootElement.TryGetProperty("text", out var text)
                ? text.GetString() ?? string.Empty
                : string.Empty;
        }
        catch
        {
            return string.Empty;
        }
    }

    private static string ExtractErrorMessage(string data)
    {
        try
        {
            using var doc = JsonDocument.Parse(data);
            return doc.RootElement.TryGetProperty("message", out var message)
                ? message.GetString() ?? "Chatbot stream failed."
                : "Chatbot stream failed.";
        }
        catch
        {
            return "Chatbot stream failed.";
        }
    }

    private sealed class ChatRequest
    {
        [JsonPropertyName("user_prompt")]
        public string UserPrompt { get; init; } = string.Empty;

        [JsonPropertyName("tool_context")]
        public string ToolContext { get; init; } = string.Empty;

        [JsonPropertyName("user_role")]
        public string UserRole { get; init; } = string.Empty;

        [JsonPropertyName("user_id")]
        public string UserId { get; init; } = string.Empty;

        [JsonPropertyName("language")]
        public string Language { get; init; } = string.Empty;
    }

    private sealed class ChatResponse
    {
        [JsonPropertyName("response")]
        public string Response { get; init; } = string.Empty;
    }

    private sealed class GuardRequest
    {
        [JsonPropertyName("message")]
        public string Message { get; init; } = string.Empty;

        [JsonPropertyName("language")]
        public string Language { get; init; } = string.Empty;
    }

    private sealed class GuardResponse
    {
        [JsonPropertyName("is_blocked")]
        public bool IsBlocked { get; init; }

        [JsonPropertyName("reason")]
        public string Reason { get; init; } = string.Empty;
    }
}

