using Cinema.Domain.Localization;

namespace Cinema.Application.Constants;

public static class ChatbotResponseMessages
{
    public static class Refusals
    {
        public const string Unauthorized = Messages.Chatbot.NoPermissionForRole;
        public const string RequireLogin = Messages.Chatbot.LoginRequired;
        public const string SystemError = Messages.Chatbot.SystemError;

        // Booking security: intentionally vague — does not reveal if order exists or not
        public const string BookingNotFound = Messages.Chatbot.BookingNotFound;
    }
}
