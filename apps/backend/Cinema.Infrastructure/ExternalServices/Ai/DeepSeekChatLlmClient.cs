using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Domain.Localization;
using Aiservice; // namespace from ai_service.proto

namespace Cinema.Infrastructure.ExternalServices.Ai;

public class DeepSeekChatLlmClient : IChatLlmClient
{
    private readonly IConfiguration                     _configuration;
    private readonly ILogger<DeepSeekChatLlmClient>      _logger;
    private readonly ILocalizationService                _localizationService;
    private readonly AiService.AiServiceClient           _client;

    public DeepSeekChatLlmClient(
        IConfiguration                  configuration,
        ILogger<DeepSeekChatLlmClient>   logger,
        ILocalizationService            localizationService,
        AiService.AiServiceClient        client)
    {
        _configuration       = configuration;
        _logger             = logger;
        _localizationService = localizationService;
        _client             = client;
    }

    public async Task<string> SendChatRequestAsync(
        string userPrompt,
        string toolContext,
        string userRole,
        string userId)
    {
        try
        {
            var request = new ChatRequest
            {
                UserPrompt  = userPrompt,
                ToolContext = toolContext,
                UserRole    = userRole,
                UserId      = userId,
                Language    = _localizationService.CurrentLanguage
            };

            var reply = await _client.ChatAsync(request);
            return reply.Response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "gRPC Chat failed.");
            throw;
        }
    }

    public async IAsyncEnumerable<string> StreamChatRequestAsync(
        string          userPrompt,
        string          toolContext,
        string          userRole,
        string          userId,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var request = new ChatRequest
        {
            UserPrompt  = userPrompt,
            ToolContext = toolContext,
            UserRole    = userRole,
            UserId      = userId,
            Language    = _localizationService.CurrentLanguage
        };

        using var call = _client.ChatStream(request);

        while (await call.ResponseStream.MoveNext(cancellationToken))
        {
            yield return call.ResponseStream.Current.Response;
        }
    }

    public async Task<ChatGuardResult> CheckMessageSafetyAsync(string message)
    {
        try
        {
            var request = new GuardRequest
            {
                Message  = message,
                Language = _localizationService.CurrentLanguage
            };

            var reply = await _client.GuardAsync(request);
            return new ChatGuardResult(
                IsBlocked: reply.IsBlocked,
                Reason:    reply.Reason);
        }
        catch (Exception ex)
        {
            // Fail-open: nếu không gọi được Guard, cho qua
            _logger.LogWarning(ex, "gRPC Guard check failed. Failing open.");
            return new ChatGuardResult(IsBlocked: false, Reason: string.Empty);
        }
    }
}
