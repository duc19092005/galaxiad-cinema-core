using System;
using System.Threading.Tasks;
using Cinema.Application.Interfaces;
using Cinema.Application.Interfaces.Chatbot;
using Cinema.Domain.Constants;

namespace Cinema.Application.UseCases.Chatbot.Policy;

public class ChatPolicyService : IChatPolicyService
{
    private readonly IUserContextService _userContextService;

    public ChatPolicyService(IUserContextService userContextService)
    {
        _userContextService = userContextService;
    }

    public Task<bool> IsAuthorizedAsync(string intent)
    {
        switch (intent)
        {
            // Public — không cần đăng nhập
            case ChatbotConstants.Intents.GeneralFAQ:
            case ChatbotConstants.Intents.GetMovies:
            case ChatbotConstants.Intents.GetShowtimes:
            case ChatbotConstants.Intents.GetPromotions:
            case ChatbotConstants.Intents.GetCinemaLocations:
            case ChatbotConstants.Intents.GetAvailableSeats:
            case ChatbotConstants.Intents.SearchMoviesSemantic:
                return Task.FromResult(true);

            // Phải đăng nhập
            case ChatbotConstants.Intents.GetMyBookings:
            case ChatbotConstants.Intents.GetBookingStatus:
                try
                {
                    var userId = _userContextService.GetUserId();
                    return Task.FromResult(userId != Guid.Empty);
                }
                catch
                {
                    return Task.FromResult(false);
                }

            // Chỉ dành cho Manager / Admin
            case ChatbotConstants.Intents.GetCinemaStatistics:
                var isManagerOrAdmin = _userContextService.IsInRole("TheaterManager") ||
                                       _userContextService.IsInRole("FacilitiesManager") ||
                                       _userContextService.IsInRole("Admin");
                return Task.FromResult(isManagerOrAdmin);

            case ChatbotConstants.Intents.GetShowtimeRecommendations:
                var isSchedulePlanner = _userContextService.IsInRole("TheaterManager") ||
                                        _userContextService.IsInRole("Admin");
                return Task.FromResult(isSchedulePlanner);

            // Chỉ Admin
            case ChatbotConstants.Intents.GetSystemAuditLogs:
                var isAdmin = _userContextService.IsInRole("Admin");
                return Task.FromResult(isAdmin);

            default:
                // Từ chối tất cả intent không xác định
                return Task.FromResult(false);
        }
    }
}
