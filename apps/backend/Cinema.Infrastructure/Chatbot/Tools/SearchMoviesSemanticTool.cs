using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.Catalog;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Domain.Constants;
using Cinema.Domain.Localization;

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

        // ==========================================================
        // TWO-STEP EMBEDDING APPROACH
        // ==========================================================
        // Step 1: Text query → tìm phim user đang nhắc đến (e.g. "BatMan" → "The Batman")
        // Step 2: Dùng vector của phim đó → tìm phim thực sự giống về nội dung
        // ==========================================================

        // Step 1: Text-based search — find the referenced movie
        var step1Results = await _aiSearchClient.RecommendAsync(semanticQuery, topK: 3);

        if (step1Results.Count == 0)
        {
            return JsonSerializer.Serialize(new { Message = Messages.Chatbot.NoMatchingMovies });
        }

        // Take the top result as the movie user is referencing
        var referencedMovieId = step1Results[0].MovieId;
        var referencedDistance = step1Results[0].Distance;

        // Step 2: Vector-to-vector search — find movies truly similar to the referenced movie
        // Exclude the referenced movie itself from results
        var step2Results = await _aiSearchClient.RecommendByIdAsync(referencedMovieId, topK: 5);

        if (step2Results.Count == 0)
        {
            // Fallback: các phim khác từ step 1 (trừ chính nó)
            var fallbackMovies = step1Results
                .Skip(1)  // bỏ phim đầu (referenced movie)
                .Select(r => new AiMovieScore(r.MovieId, r.Distance))
                .ToList();

            if (fallbackMovies.Count == 0)
                return JsonSerializer.Serialize(new { Message = Messages.Chatbot.NoMatchingMovies });

            step2Results = fallbackMovies;
        }

        // Fetch movie details from DB
        var allIds = step2Results
            .Select(r => Guid.TryParse(r.MovieId, out var id) ? id : Guid.Empty)
            .Where(id => id != Guid.Empty)
            .ToList();

        var movies = await _catalogRepo.GetMoviesByIdsAsync(allIds);

        // Filter: chỉ hiển thị phim chưa xóa, đang hoạt động hoặc sắp chiếu, chưa hết hạn
        var now = DateTime.UtcNow;
        movies = movies.Where(m => !m.IsDeleted && (m.IsActive || m.IsCommingSoon) && now <= m.EndedDate).ToList();

        // Filter theo status nếu có
        movies = status?.ToLower() switch
        {
            "now_showing"  => movies.Where(m => !m.IsCommingSoon && m.ActiveAt <= now).ToList(),
            "coming_soon"  => movies.Where(m => m.IsCommingSoon || now < m.ActiveAt).ToList(),
            _              => movies
        };

        if (movies.Count == 0)
        {
            return JsonSerializer.Serialize(new { Message = Messages.Chatbot.NoMoviesFound });
        }

        // Giữ thứ tự similarity từ Qdrant
        var scoreMap = step2Results.ToDictionary(
            r => r.MovieId,
            r => r.Distance);

        var sortedMovies = movies
            .OrderByDescending(m => scoreMap.GetValueOrDefault(m.MovieId.ToString(), 0.0))
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
            SimilarityPct  = (int)Math.Round(scoreMap.GetValueOrDefault(m.MovieId.ToString(), 0.0) * 100)
        }));
    }
}
