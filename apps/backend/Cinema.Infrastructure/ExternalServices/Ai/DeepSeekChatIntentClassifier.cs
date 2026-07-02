using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Cinema.Application.Dtos.Chatbot;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Domain.Constants;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Aiservice; // namespace from ai_service.proto

namespace Cinema.Infrastructure.ExternalServices.Ai;

public class DeepSeekChatIntentClassifier : IChatIntentClassifier
{
    private readonly IConfiguration                       _configuration;
    private readonly ILogger<DeepSeekChatIntentClassifier> _logger;
    private readonly AiService.AiServiceClient             _client;

    public DeepSeekChatIntentClassifier(
        IConfiguration                         configuration,
        ILogger<DeepSeekChatIntentClassifier>   logger,
        AiService.AiServiceClient               client)
    {
        _configuration = configuration;
        _logger        = logger;
        _client        = client;
    }

    public async Task<ChatIntentResult> ClassifyIntentAsync(string message)
    {
        try
        {
            var request = new ClassifyIntentRequest { Message = message };
            var reply = await _client.ClassifyIntentAsync(request);

            var parameters = new Dictionary<string, string>(reply.Parameters);
            return new ChatIntentResult { Intent = reply.Intent, Parameters = parameters };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "gRPC ClassifyIntent failed. Falling back to GeneralFAQ.");
            return new ChatIntentResult { Intent = "GeneralFAQ", Parameters = new Dictionary<string, string>() }; 
        }
    }
}
