using Cinema.Domain.Localization;

namespace Cinema.Application.Constants;

public static class ChatbotResponseMessages
{
    public static class Refusals
    {
        public const string Unauthorized = Messages.Chatbot.NoPermissionForRole;
        public const string RequireLogin = Messages.Chatbot.LoginRequired;
        public const string SystemError = Messages.Chatbot.SystemError;

        // Booking security: thông báo mơ hồ cố ý — không tiết lộ đơn tồn tại hay không
        public const string BookingNotFound =
            "Không tìm thấy đơn đặt vé với mã này. Vui lòng kiểm tra lại mã hoặc đảm bảo bạn đang đăng nhập đúng tài khoản.";
    }
}
