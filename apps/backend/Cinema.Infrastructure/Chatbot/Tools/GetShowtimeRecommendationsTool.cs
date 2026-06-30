using System.Text.Json;
using Cinema.Application.Dtos.TheaterManager.ShowtimeRecommendations;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Application.UseCases.TheaterManager.ShowtimeRecommendations;
using Cinema.Domain.Constants;
using Cinema.Domain.Localization;

namespace Cinema.Infrastructure.Chatbot.Tools;

public class GetShowtimeRecommendationsTool : IChatTool
{
    private readonly GenerateShowtimeRecommendationsUseCase _generateUseCase;

    public GetShowtimeRecommendationsTool(GenerateShowtimeRecommendationsUseCase generateUseCase)
    {
        _generateUseCase = generateUseCase;
    }

    public string IntentName => ChatbotConstants.Intents.GetShowtimeRecommendations;

    public async Task<string> ExecuteAsync(Dictionary<string, string> parameters)
    {
        if (!TryGetGuid(parameters, "cinemaId", out var cinemaId))
        {
            return JsonSerializer.Serialize(new
            {
                Message = Messages.ShowtimeRecommendation.ChatbotCinemaRequired,
                RequiredParameter = "cinemaId"
            });
        }

        var fromDate = TryGetDate(parameters, "fromDate", out var parsedFromDate)
            ? parsedFromDate
            : DateTime.UtcNow.Date.AddDays(1);
        var toDate = TryGetDate(parameters, "toDate", out var parsedToDate)
            ? parsedToDate
            : fromDate.AddDays(6);
        var auditoriumId = TryGetGuid(parameters, "auditoriumId", out var parsedAuditoriumId)
            ? parsedAuditoriumId
            : (Guid?)null;
        var maxSuggestions = TryGetInt(parameters, "maxSuggestions", out var parsedMax)
            ? parsedMax
            : 10;

        var response = await _generateUseCase.ExecuteAsync(new GenerateShowtimeRecommendationsRequest
        {
            CinemaId = cinemaId,
            FromDate = fromDate,
            ToDate = toDate,
            AuditoriumId = auditoriumId,
            MaxSuggestions = maxSuggestions
        });

        return JsonSerializer.Serialize(response.Data);
    }

    private static bool TryGetGuid(Dictionary<string, string> parameters, string key, out Guid value)
    {
        value = Guid.Empty;
        var item = parameters.FirstOrDefault(x => string.Equals(x.Key, key, StringComparison.OrdinalIgnoreCase));
        return !string.IsNullOrWhiteSpace(item.Value) && Guid.TryParse(item.Value, out value);
    }

    private static bool TryGetDate(Dictionary<string, string> parameters, string key, out DateTime value)
    {
        value = default;
        var item = parameters.FirstOrDefault(x => string.Equals(x.Key, key, StringComparison.OrdinalIgnoreCase));
        return !string.IsNullOrWhiteSpace(item.Value) && DateTime.TryParse(item.Value, out value);
    }

    private static bool TryGetInt(Dictionary<string, string> parameters, string key, out int value)
    {
        value = default;
        var item = parameters.FirstOrDefault(x => string.Equals(x.Key, key, StringComparison.OrdinalIgnoreCase));
        return !string.IsNullOrWhiteSpace(item.Value) && int.TryParse(item.Value, out value);
    }
}
