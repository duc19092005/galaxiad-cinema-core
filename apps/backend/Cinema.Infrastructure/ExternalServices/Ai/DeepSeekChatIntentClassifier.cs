using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Chatbot;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Domain.Constants;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Cinema.Infrastructure.Services;

public class DeepSeekChatIntentClassifier : IChatIntentClassifier
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<DeepSeekChatIntentClassifier> _logger;
    private static readonly HttpClient HttpClient = new();

    public DeepSeekChatIntentClassifier(IConfiguration configuration, ILogger<DeepSeekChatIntentClassifier> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<ChatIntentResult> ClassifyIntentAsync(string message)
    {
        var aiServiceUrl = _configuration["AiService:BaseUrl"]?.TrimEnd('/') ?? "http://cinema-ai-service:8000";

        try
        {
            var payload = new ClassifyRequest { Message = message };
            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            using var response = await HttpClient.PostAsync($"{aiServiceUrl}/classify-intent", content);
            response.EnsureSuccessStatusCode();

            var responseText = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<ClassifyResponse>(responseText);

            if (result == null)
            {
                return GetFallbackResult();
            }

            // Fallback default intent if invalid or unknown
            var intent = result.Intent;
            if (intent != ChatbotConstants.Intents.GetMovies &&
                intent != ChatbotConstants.Intents.GetShowtimes &&
                intent != ChatbotConstants.Intents.GetMyBookings &&
                intent != ChatbotConstants.Intents.GetCinemaStatistics &&
                intent != ChatbotConstants.Intents.GetShowtimeRecommendations &&
                intent != ChatbotConstants.Intents.GetSystemAuditLogs)
            {
                intent = ChatbotConstants.Intents.GeneralFAQ;
            }

            return new ChatIntentResult
            {
                Intent = intent,
                Parameters = result.Parameters ?? []
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to call Python AI service classify-intent endpoint at {Url}.", aiServiceUrl);
            return GetFallbackResult();
        }
    }

    private static ChatIntentResult GetFallbackResult()
    {
        return new ChatIntentResult
        {
            Intent = ChatbotConstants.Intents.GeneralFAQ,
            Parameters = []
        };
    }

    private sealed class ClassifyRequest
    {
        [JsonPropertyName("message")]
        public string Message { get; init; } = string.Empty;
    }

    private sealed class ClassifyResponse
    {
        [JsonPropertyName("intent")]
        public string Intent { get; init; } = string.Empty;

        [JsonPropertyName("parameters")]
        public Dictionary<string, string> Parameters { get; init; } = [];
    }
}
