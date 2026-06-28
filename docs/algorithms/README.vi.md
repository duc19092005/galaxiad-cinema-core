# Tổng quan thuật toán

Ngôn ngữ: [English](README.md) | [Tiếng Việt](README.vi.md) | [Русский](README.ru.md)

Thư mục này mô tả các thuật toán sản phẩm và thuật toán kỹ thuật được dùng trong hệ thống Galaxiad Cinema.

## Tài liệu

| Tài liệu | English | Tiếng Việt | Russian |
| --- | --- | --- | --- |
| Thuật toán tìm kiếm phim | [movie-search.md](movie-search.md) | [movie-search.vi.md](movie-search.vi.md) | [movie-search.ru.md](movie-search.ru.md) |
| Thuật toán gợi ý phim | [movie-recommendation.md](movie-recommendation.md) | [movie-recommendation.vi.md](movie-recommendation.vi.md) | [movie-recommendation.ru.md](movie-recommendation.ru.md) |
| Khuyến mãi giá động | [pricing-promotions.md](pricing-promotions.md) | [pricing-promotions.vi.md](pricing-promotions.vi.md) | [pricing-promotions.ru.md](pricing-promotions.ru.md) |
| Kế hoạch chatbot theo vai trò | [role-aware-chatbot.md](role-aware-chatbot.md) | [role-aware-chatbot.vi.md](role-aware-chatbot.vi.md) | [role-aware-chatbot.ru.md](role-aware-chatbot.ru.md) |
| Chiến lược Redis Cache | [redis-cache-strategy.md](redis-cache-strategy.md) | [redis-cache-strategy.vi.md](redis-cache-strategy.vi.md) | [redis-cache-strategy.ru.md](redis-cache-strategy.ru.md) |
| Quy tắc xếp lịch ca làm | [shift-schedule-rules.md](shift-schedule-rules.md) | [shift-schedule-rules.vi.md](shift-schedule-rules.vi.md) | [shift-schedule-rules.ru.md](shift-schedule-rules.ru.md) |

## AI Showtime Planner

AI Showtime Planner hỗ trợ Quản lý rạp và Admin nhận gợi ý xếp lịch chiếu phim. Ở phiên bản V1, hệ thống không train model riêng. Backend chấm điểm bằng luật nghiệp vụ dựa trên dữ liệu thật, lưu lịch sử gợi ý và thao tác áp dụng, còn LLM chỉ dùng để giải thích bằng ngôn ngữ tự nhiên thông qua chatbot.

Dữ liệu đầu vào chính:

1. Xu hướng vé đã thanh toán, tỷ lệ lấp đầy và doanh thu.
2. Tín hiệu lượt xem hoặc tìm kiếm phim nếu có.
3. Đánh giá và bình luận của khách hàng.
4. Độ mới của phim và khoảng thời gian phim được phép chiếu.
5. Sức chứa phòng chiếu, định dạng phòng hỗ trợ và các lịch chiếu đang tồn tại.
6. Khung giờ vàng, gồm buổi tối ngày thường và các khung giờ mạnh hơn vào cuối tuần.

Cam kết nghiệp vụ chính:

1. LLM không bao giờ trực tiếp tạo lịch chiếu.
2. Quản lý phải xem trước gợi ý trước khi áp dụng.
3. Khi áp dụng, backend luôn kiểm tra lại quyền chiếu phim, định dạng phim, thời gian hiệu lực của phim, thời gian trong quá khứ, trùng phòng chiếu và khoảng dọn phòng.
4. Các thao tác đã xem, đã áp dụng, đã bỏ qua và lỗi kiểm tra đều được lưu để audit và cải thiện về sau.

## Nguyên tắc cốt lõi

Luôn dùng đường xử lý rẻ và đáng tin cậy nhất trước:

1. Dùng SQL xác định cho các câu hỏi nghiệp vụ có cấu trúc.
2. Dùng SQL kết hợp phần tóm tắt LLM có giới hạn cho câu hỏi phân tích trên bình luận hoặc số liệu.
3. Chỉ dùng semantic search hoặc RAG khi ý định của người dùng phụ thuộc vào ngữ nghĩa, độ tương đồng, văn bản chính sách hoặc ngôn ngữ tự nhiên mơ hồ.

LLM nên phụ trách phân loại ý định và viết phần giải thích cuối cùng. Backend phải sở hữu phân quyền, truy vấn SQL, gọi vector search, cắt giảm dữ liệu và lọc phạm vi cuối cùng.
