using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Domain.Constants;

namespace Cinema.Infrastructure.Chatbot.Tools;

public class GetCinemaLocationsTool : IChatTool
{
    private readonly IBookingCatalogRepository _bookingCatalogRepo;

    public GetCinemaLocationsTool(IBookingCatalogRepository bookingCatalogRepo)
    {
        _bookingCatalogRepo = bookingCatalogRepo;
    }

    public string IntentName => ChatbotConstants.Intents.GetCinemaLocations;

    public async Task<string> ExecuteAsync(Dictionary<string, string> parameters)
    {
        parameters.TryGetValue("city", out var city);

        var cinemas = await _bookingCatalogRepo.GetActiveCinemasAsync();

        if (!string.IsNullOrWhiteSpace(city))
        {
            cinemas = cinemas
                .Where(c => c.CinemaCity.Contains(city, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        if (cinemas.Count == 0)
        {
            return JsonSerializer.Serialize(new
            {
                Message = string.IsNullOrWhiteSpace(city)
                    ? "Hiện tại chưa có thông tin rạp."
                    : $"Không tìm thấy rạp nào tại '{city}'."
            });
        }

        // Chỉ trả về thông tin công khai — không lộ ManagerId hay thông tin nội bộ
        return JsonSerializer.Serialize(cinemas.Select(c => new
        {
            c.CinemaId,
            c.CinemaName,
            c.CinemaLocation,
            c.CinemaCity
        }));
    }
}
