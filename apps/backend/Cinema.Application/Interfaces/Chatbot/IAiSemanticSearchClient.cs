using System.Collections.Generic;
using System.Threading.Tasks;

namespace Cinema.Application.Interfaces.Chatbot;

/// <summary>
/// Client để gọi Python AI Service /recommend endpoint cho semantic movie search.
/// Tách biệt khỏi IChatLlmClient để đảm bảo Single Responsibility Principle.
/// </summary>
public interface IAiSemanticSearchClient
{
    Task<List<AiMovieScore>> RecommendAsync(string queryText, int topK = 10);
}

public record AiMovieScore(string MovieId, double Distance);
