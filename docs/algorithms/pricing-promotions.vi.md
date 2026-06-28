# Thuật Toán Khuyến Mãi Định Giá Động

Tài liệu này giải thích thuật toán định giá vé tự động.

## Nguyên Tắc Chính

Giá vé được tính toán lại ở phía backend mỗi khi trang đặt vé yêu cầu và một lần nữa khi đơn hàng được tạo. Frontend chỉ hiển thị kết quả, không can thiệp vào tính toán.

## Mô Hình Dữ Liệu

- **PricingPromotionEntity**: Lưu thông tin chiến dịch khuyến mãi (tên, slug, tiêu đề, mô tả, hình ảnh, ngày hiệu lực)
- **PricingPromotionRuleEntity**: Lưu các quy tắc tính giá (phạm vi áp dụng, loại khuyến mãi, giá trị, ngày/giờ, ngày trong tuần, mức ưu tiên)
- **HolidayCalendarEntity**: Lưu ngày lễ Việt Nam

## Các Loại Khuyến Mãi

1. **FixedTicketPrice**: Ấn định giá vé ở mức cụ thể (ví dụ 45.000đ)
2. **PercentDiscount**: Giảm phần trăm từ giá hiện tại (ví dụ giảm 10%)
3. **FixedDiscount**: Giảm số tiền cố định (ví dụ giảm 20.000đ)
4. **Surcharge**: Cộng thêm phần trăm vào giá hiện tại (ví dụ +10%)

## Cách Tính Giá

1. Bắt đầu với giá cơ bản theo định dạng phim
2. Áp dụng phụ thu theo định dạng/rạp/phân khúc khách hàng
3. Tìm tất cả quy tắc khuyến mãi đang hoạt động phù hợp
4. Nếu có quy tắc **FixedTicketPrice**, sử dụng giá đó (ưu tiên cao nhất thắng)
5. Nếu không có, áp dụng các quy tắc giảm giá/phụ thu theo thứ tự ưu tiên
6. Giá cuối cùng không được dưới 0

## Mặt Nạ Ngày Trong Tuần

Mỗi ngày trong tuần được gán một giá trị bit:
- Thứ Hai: 1, Thứ Ba: 2, Thứ Tư: 4, Thứ Năm: 8, Thứ Sáu: 16, Thứ Bảy: 32, Chủ Nhật: 64
- Lưu dưới dạng số nguyên và so khớp bằng phép AND bit

## Ảnh Chụp Đặt Vé

Khi đặt vé, backend chụp ảnh giá và khuyến mãi đã áp dụng để lưu trữ lịch sử, đảm bảo giá vé cũ không bị thay đổi dù admin sửa/xóa khuyến mãi sau này.
