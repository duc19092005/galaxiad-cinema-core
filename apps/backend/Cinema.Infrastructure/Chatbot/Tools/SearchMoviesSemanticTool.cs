using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.Catalog;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Domain.Constants;
using Cinema.Domain.Localization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Cinema.Infrastructure.Chatbot.Tools;

public class SearchMoviesSemanticTool : IChatTool
{
    private readonly IPublicCatalogRepository            _catalogRepo;
    private readonly IAiSemanticSearchClient             _aiSearchClient;

    public SearchMoviesSemanticTool(
        IPublicCatalogRepository catalogRepo,
        IAiSemanticSearchClient  aiSearchClient)
    {
        _catalogRepo    = catalogRepo;
        _aiSearchClient = aiSearchClient;
    }

    public string IntentName => ChatbotConstants.Intents.SearchMoviesSemantic;

    public async Task<string> ExecuteAsync(Dictionary<string, string> parameters)
    {
        parameters.TryGetValue("semantic_query", out var semanticQuery);
        parameters.TryGetValue("status",         out var status);

        if (string.IsNullOrWhiteSpace(semanticQuery))
        {
            return JsonSerializer.Serialize(new { Error = "Không hiểu yêu cầu tìm kiếm. Bạn có thể mô tả rõ hơn không?" });
        }

        // Step 1: Semantic search qua Python AI Service /recommend (Qdrant cosine similarity)
        var semanticResults = await _aiSearchClient.RecommendAsync(semanticQuery, topK: 10);

        if (semanticResults.Count == 0)
        {
            return JsonSerializer.Serialize(new { Message = Messages.Chatbot.NoMatchingMovies });
        }

        var orderedIds = semanticResults
            .Select(r => Guid.TryParse(r.MovieId, out var id) ? id : Guid.Empty)
            .Where(id => id != Guid.Empty)
            .ToList();

        // Step 2: Fetch từ DB theo danh sách ID từ Qdrant
        var movies = await _catalogRepo.GetMoviesByIdsAsync(orderedIds);

        // Step 3: Áp dụng filter theo status nếu có
        var now = DateTime.UtcNow;
        movies = status?.ToLower() switch
        {
            "now_showing"  => movies.Where(m => !m.IsCommingSoon && m.EndedDate >= now).ToList(),
            "coming_soon"  => movies.Where(m => m.IsCommingSoon || now < m.ActiveAt).ToList(),
            _              => movies
        };

        if (movies.Count == 0)
        {
            return JsonSerializer.Serialize(new { Message = Messages.Chatbot.NoMoviesFound });
        }

        // Step 4: Giữ thứ tự similarity từ Qdrant (distance nhỏ = tương đồng cao hơn)
        var scoreMap = semanticResults.ToDictionary(
            r => r.MovieId,
            r => r.Distance);

        var sortedMovies = movies
            .OrderBy(m => scoreMap.GetValueOrDefault(m.MovieId.ToString(), 1.0))
            .Take(5)
            .ToList();

        return JsonSerializer.Serialize(sortedMovies.Select(m => new
        {
            m.MovieId,
            m.MovieName,
            m.Director,
            Genres         = m.MovieGenreMovieInfoEntity
                              .Select(g => g.MovieGenreInfoEntity.MovieGenreName)
                              .ToList(),
            IsNowShowing   = !m.IsCommingSoon && m.EndedDate >= now,
            IsComingSoon   = m.IsCommingSoon,
            SimilarityPct  = (int)Math.Round((1.0 - scoreMap.GetValueOrDefault(m.MovieId.ToString(), 1.0)) * 100)
        }));
    }
}
