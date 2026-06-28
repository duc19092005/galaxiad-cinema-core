namespace Cinema.Domain.Constants;

public static class ChatbotConstants
{
    public static class Intents
    {
        public const string GetMovies = "GetMovies";
        public const string GetShowtimes = "GetShowtimes";
        public const string GetMyBookings = "GetMyBookings";
        public const string GetCinemaStatistics = "GetCinemaStatistics";
        public const string GetShowtimeRecommendations = "GetShowtimeRecommendations";
        public const string GetSystemAuditLogs = "GetSystemAuditLogs";
        public const string GeneralFAQ = "GeneralFAQ";
    }

    public static class RefusalMessages
    {
        public const string Unauthorized = "Bạn không có quyền thực hiện yêu cầu này với vai trò hiện tại.";
        public const string RequireLogin = "Vui lòng đăng nhập để thực hiện yêu cầu này.";
        public const string SystemError = "Hệ thống đang gặp sự cố khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.";
    }
}
