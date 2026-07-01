using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Application.UseCases.Customer.Engagement.Comments;
using Cinema.Domain.Constants;

namespace Cinema.Infrastructure.Chatbot.Tools;

public class GetTrendingMoviesTool : IChatTool
{
    private readonly GetTrendingMoviesUseCase _getTrendingMoviesUseCase;

    public GetTrendingMoviesTool(GetTrendingMoviesUseCase getTrendingMoviesUseCase)
    {
        _getTrendingMoviesUseCase = getTrendingMoviesUseCase;
    }

    public string IntentName => ChatbotConstants.Intents.GetTrendingMovies;

    public async Task<string> ExecuteAsync(Dictionary<string, string> parameters)
    {
        // Parse optional parameters: days (default 30), take (default 10)
        int days = 30;
        int take = 10;
        if (parameters.TryGetValue("days", out var daysStr) && int.TryParse(daysStr, out var parsedDays))
            days = parsedDays;
        if (parameters.TryGetValue("take", out var takeStr) && int.TryParse(takeStr, out var parsedTake))
            take = parsedTake;

        var result = await _getTrendingMoviesUseCase.ExecuteAsync(days, take, cinemaId: null, city: null);

        if (!result.IsSuccess || result.Data == null || result.Data.Count == 0)
        {
            return JsonSerializer.Serialize(new { Message = "Hiện không có dữ liệu phim thịnh hành." });
        }

        // Trả về danh sách trending movies — chỉ public info
        var output = result.Data.Select(m => new
        {
            m.MovieId,
            m.MovieName,
            m.MovieImageUrl,
            m.MovieDescription,
            m.MovieDuration,
            m.MovieRequiredAgeSymbol,
            m.PaidTicketCount,
            m.ViewCount,
            m.AverageRating,
            m.RatingCount,
            m.TrendingScore
        });

        return JsonSerializer.Serialize(output);
    }
}
