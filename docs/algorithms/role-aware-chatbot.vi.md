# Chatbot Thông Minh Theo Vai Trò

Tài liệu này giải thích kế hoạch triển khai chatbot trong hệ thống.

## Tổng Quan

Chatbot hỗ trợ khách hàng và nhân viên với các câu hỏi thường gặp và tác vụ cơ bản.

## Các Chủ Đề

1. **GeneralFAQ**: Câu hỏi chung về đặt vé, thanh toán, tài khoản
2. **GetMovies**: Danh sách phim đang chiếu và sắp chiếu
3. **GetShowtimes**: Giờ chiếu theo phim hoặc rạp
4. **GetMyBookings**: Lịch sử đặt vé của người dùng
5. **GetCinemaStatistics**: Thống kê rạp (yêu cầu quyền quản lý)
6. **GetSystemAuditLogs**: Nhật ký kiểm toán hệ thống (yêu cầu quyền Admin)

## Phân Loại Vai Trò

- **Khách chưa đăng nhập**: Chỉ truy vấn FAQ và danh sách phim
- **Khách hàng**: FAQ, phim, suất chiếu, đặt vé của mình
- **Quản lý**: Thêm thống kê rạp
- **Admin**: Thêm nhật ký kiểm toán hệ thống

## Quy Tắc An Toàn

- Chatbot không tiết lộ thông tin nhạy cảm
- Chatbot từ chối các yêu cầu không có quyền
- LLM phân loại ý định, backend thực thi quyền và truy vấn dữ liệu
