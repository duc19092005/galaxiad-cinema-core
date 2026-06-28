using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Cinema.Application.Interfaces.Chatbot;

namespace Cinema.Infrastructure.Services;

public class DeepSeekChatLlmClient : IChatLlmClient
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<DeepSeekChatLlmClient> _logger;
    private static readonly HttpClient HttpClient = new();

    public DeepSeekChatLlmClient(IConfiguration configuration, ILogger<DeepSeekChatLlmClient> logger)
    {
        _configuration = configuration;
        _logger = logger;
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
                UserId = userId
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
    }

    private sealed class ChatResponse
    {
        [JsonPropertyName("response")]
        public string Response { get; init; } = string.Empty;
    }
}

