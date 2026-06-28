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
            case ChatbotConstants.Intents.GeneralFAQ:
            case ChatbotConstants.Intents.GetMovies:
            case ChatbotConstants.Intents.GetShowtimes:
                // Publicly accessible by everyone
                return Task.FromResult(true);

            case ChatbotConstants.Intents.GetMyBookings:
                // Requires logged-in user
                try
                {
                    var userId = _userContextService.GetUserId();
                    return Task.FromResult(userId != Guid.Empty);
                }
                catch
                {
                    return Task.FromResult(false);
                }

            case ChatbotConstants.Intents.GetCinemaStatistics:
                // Requires manager or admin roles
                var isManagerOrAdmin = _userContextService.IsInRole("TheaterManager") ||
                                       _userContextService.IsInRole("FacilitiesManager") ||
                                       _userContextService.IsInRole("Admin");
                return Task.FromResult(isManagerOrAdmin);

            case ChatbotConstants.Intents.GetShowtimeRecommendations:
                var isSchedulePlanner = _userContextService.IsInRole("TheaterManager") ||
                                        _userContextService.IsInRole("Admin");
                return Task.FromResult(isSchedulePlanner);

            case ChatbotConstants.Intents.GetSystemAuditLogs:
                // Requires admin role only
                var isAdmin = _userContextService.IsInRole("Admin");
                return Task.FromResult(isAdmin);

            default:
                // By default, reject unknown intents
                return Task.FromResult(false);
        }
    }
}

