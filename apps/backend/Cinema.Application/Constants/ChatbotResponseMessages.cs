namespace Cinema.Application.Constants;

public static class ChatbotResponseMessages
{
    public static class Refusals
    {
        public const string Unauthorized = "Bạn không có quyền thực hiện yêu cầu này với vai trò hiện tại.";
        public const string RequireLogin = "Vui lòng đăng nhập để thực hiện yêu cầu này.";
        public const string SystemError = "Hệ thống đang gặp sự cố khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.";

        // Booking security: thông báo mơ hồ cố ý — không tiết lộ đơn tồn tại hay không
        public const string BookingNotFound =
            "Không tìm thấy đơn đặt vé với mã này. Vui lòng kiểm tra lại mã hoặc đảm bảo bạn đang đăng nhập đúng tài khoản.";
    }
}
