using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.Chatbot;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Grpc.Net.Client;
using Aiservice; // namespace from ai_service.proto

namespace Cinema.Infrastructure.ExternalServices.Ai;

/// <summary>
///   gRPC client for Python AI Service semantic movie search and recommendation.
/// </summary>
public class AiSemanticSearchClient : IAiSemanticSearchClient
{
    private readonly IConfiguration                     _configuration;
    private readonly ILogger<AiSemanticSearchClient>    _logger;
    private readonly AiService.AiServiceClient          _client;

    public AiSemanticSearchClient(
        IConfiguration                   configuration,
        ILogger<AiSemanticSearchClient>   logger,
        AiService.AiServiceClient         client)
    {
        _configuration = configuration;
        _logger        = logger;
        _client        = client;
    }

    public async Task<List<AiMovieScore>> RecommendAsync(
        string          queryText,
        int             topK       = 10,
        List<string>?   excludeIds = null)
    {
        try
        {
            var request = new RecommendRequest
            {
                UserText = queryText,
                TopK     = topK
            };
            if (excludeIds is { Count: > 0 })
                request.ExcludeIds.AddRange(excludeIds);

            var reply = await _client.RecommendAsync(request);

            if (reply.Results.Count == 0)
                return [];

            return reply.Results
                        .Select(r => new AiMovieScore(r.MovieId, r.Distance))
                        .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "gRPC RecommendAsync failed. Returning empty results.");
            return [];
        }
    }

    public async Task<List<AiMovieScore>> RecommendByIdAsync(
        string          movieId,
        int             topK       = 5,
        List<string>?   excludeIds = null)
    {
        try
        {
            var request = new RecommendByIdRequest
            {
                MovieId = movieId,
                TopK    = topK
            };
            if (excludeIds is { Count: > 0 })
                request.ExcludeIds.AddRange(excludeIds);

            var reply = await _client.RecommendByIdAsync(request);

            if (reply.Results.Count == 0)
                return [];

            return reply.Results
                        .Select(r => new AiMovieScore(r.MovieId, r.Distance))
                        .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "gRPC RecommendByIdAsync failed. Returning empty results.");
            return [];
        }
    }
}
