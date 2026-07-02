using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Cinema.Application.Interfaces.Comments;
using Aiservice; // namespace from ai_service.proto

namespace Cinema.Infrastructure.ExternalServices.Ai;

public class DeepSeekModerationService : ICommentModerationService
{
    private readonly IConfiguration                   _configuration;
    private readonly ILogger<DeepSeekModerationService> _logger;
    private readonly AiService.AiServiceClient         _client;

    public DeepSeekModerationService(
        IConfiguration                   configuration,
        ILogger<DeepSeekModerationService> logger,
        AiService.AiServiceClient         client)
    {
        _configuration = configuration;
        _logger        = logger;
        _client        = client;
    }

    public async Task<CommentModerationResult> ModerateAsync(
        string content,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var request = new ModerationRequest { Content = content };
            var reply = await _client.ModerateAsync(request);
            return new CommentModerationResult(reply.Blocked, reply.Reason);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "gRPC Moderate failed. Failing open.");
            return new CommentModerationResult(false, "Moderation service unavailable.");
        }
    }
}
