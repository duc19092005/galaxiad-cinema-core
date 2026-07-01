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

    public DeepSeekChatIntentClassifier(
        IConfiguration configuration,
        ILogger<DeepSeekChatIntentClassifier> logger)
    {
        _configuration = configuration;
        _logger        = logger;
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
            var result       = JsonSerializer.Deserialize<ClassifyResponse>(responseText);

            if (result == null)
                return GetFallbackResult();

            // Whitelist kiểm tra intent — nếu không nằm trong danh sách hợp lệ, fallback về GeneralFAQ
            var intent = result.Intent;
            var validIntents = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                ChatbotConstants.Intents.GetMovies,
                ChatbotConstants.Intents.GetShowtimes,
                ChatbotConstants.Intents.GetMyBookings,
                ChatbotConstants.Intents.GetCinemaStatistics,
                ChatbotConstants.Intents.GetShowtimeRecommendations,
                ChatbotConstants.Intents.GetSystemAuditLogs,
                ChatbotConstants.Intents.GeneralFAQ,
                // Intents mới
                ChatbotConstants.Intents.GetPromotions,
                ChatbotConstants.Intents.GetBookingStatus,
                ChatbotConstants.Intents.GetCinemaLocations,
                ChatbotConstants.Intents.GetAvailableSeats,
                ChatbotConstants.Intents.SearchMoviesSemantic,
                ChatbotConstants.Intents.GetTrendingMovies,
            };

            if (!validIntents.Contains(intent))
                intent = ChatbotConstants.Intents.GeneralFAQ;

            return new ChatIntentResult
            {
                Intent     = intent,
                Parameters = result.Parameters ?? []
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to call Python AI service classify-intent endpoint at {Url}.", aiServiceUrl);
            return GetFallbackResult();
        }
    }

    private static ChatIntentResult GetFallbackResult() =>
        new() { Intent = ChatbotConstants.Intents.GeneralFAQ, Parameters = [] };

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
