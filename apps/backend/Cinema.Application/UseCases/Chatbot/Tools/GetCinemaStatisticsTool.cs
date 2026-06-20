using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Application.Interfaces.Admin;
using Cinema.Domain.Constants;

namespace Cinema.Application.UseCases.Chatbot.Tools;

public class GetCinemaStatisticsTool : IChatTool
{
    private readonly IAdminRepository _adminRepository;

    public GetCinemaStatisticsTool(IAdminRepository adminRepository)
    {
        _adminRepository = adminRepository;
    }

    public string IntentName => ChatbotConstants.Intents.GetCinemaStatistics;

    public async Task<string> ExecuteAsync(Dictionary<string, string> parameters)
    {
        var now = DateTime.UtcNow;
        var startOfDay = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);
        var endOfDay = startOfDay.AddDays(1);

        // Fetch general system statistics
        var activeUsers = await _adminRepository.GetActiveUsersCountAsync();
        var cinemasCount = await _adminRepository.GetCinemasCountAsync(null);
        var activeMovies = await _adminRepository.GetActiveMoviesCountAsync(null, null);
        var paidOrders = await _adminRepository.GetPaidOrdersCountAsync(null, null, null);
        var totalTicketsSold = await _adminRepository.GetTotalTicketsSoldAsync(null, null, null);
        var todayStats = await _adminRepository.GetTodayStatsAsync(startOfDay, endOfDay, null, null, null);

        var result = new
        {
            TotalActiveUsers = activeUsers,
            TotalCinemasCount = cinemasCount,
            TotalActiveMovies = activeMovies,
            TotalPaidOrders = paidOrders,
            TotalTicketsSold = totalTicketsSold,
            TodayStats = new
            {
                TicketsSoldToday = todayStats.tickets,
                RevenueToday = todayStats.revenue
            }
        };

        return JsonSerializer.Serialize(result);
    }
}
