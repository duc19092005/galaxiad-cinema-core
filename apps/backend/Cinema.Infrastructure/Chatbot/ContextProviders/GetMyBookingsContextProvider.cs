using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Application.Interfaces.Booking;
using Cinema.Application.Interfaces;
using Cinema.Application.Constants;
using Cinema.Domain.Constants;
using Cinema.Domain.Utils;
using Cinema.Domain.Localization;

namespace Cinema.Infrastructure.Chatbot.ContextProviders;

public class GetMyBookingsContextProvider : IChatContextProvider
{
    private readonly IUserBookingRepository _repo;
    private readonly IUserContextService _userContextService;

    public GetMyBookingsContextProvider(IUserBookingRepository repo, IUserContextService userContextService)
    {
        _repo = repo;
        _userContextService = userContextService;
    }

    public string IntentName => ChatbotConstants.Intents.GetMyBookings;

    public async Task<string> ExecuteAsync(Dictionary<string, string> parameters)
    {
        var userId = _userContextService.GetUserId();
        if (userId == Guid.Empty)
        {
            return JsonSerializer.Serialize(new { Error = ChatbotResponseMessages.Refusals.RequireLogin });
        }

        var account = await _repo.GetUserAccountInfoAsync(userId);
        var nowUtc = DateTime.UtcNow;
        var orders = await _repo.GetUserBookingHistoryDtosAsync(userId, account?.UserEmail ?? string.Empty, nowUtc);

        var result = orders.Select(o => new
        {
            o.OrderId,
            o.OrderDate,
            o.TotalPrice,
            o.OrderStatus,
            o.MovieId,
            o.MovieName,
            o.CinemaName,
            o.AuditoriumNumber,
            StartTime = DateTimeHelper.ToVietnamTime(o.StartTime),
            o.Seats,
            MovieAiringStatus = o.MovieAiringStatus == "Upcoming" ? "Sắp chiếu (Upcoming)" :
                                o.MovieAiringStatus == "Airing" ? "Đang chiếu (Airing)" : "Đã kết thúc (Finished)"
        }).ToList();

        return JsonSerializer.Serialize(result);
    }
}
