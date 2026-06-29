# Chiến Lược Cache Redis

Tài liệu này giải thích chiến lược cache Redis được sử dụng trong hệ thống.

## Cache-Aside Pattern

Hệ thống sử dụng mô hình **Cache-Aside**: 
1. Khi có yêu cầu dữ liệu, hệ thống kiểm tra Redis trước
2. Nếu có trong cache (cache hit), trả về dữ liệu từ Redis
3. Nếu không có trong cache (cache miss), truy vấn từ database và lưu vào Redis
4. Dữ liệu được cache với thời gian hết hạn (TTL)

## Cấu Trúc Key

- `seat:temp_hold:{ScheduleId}:{SeatId}` — Giữ ghế tạm thời khi đặt vé
- `session:{UserId}` — Phiên đăng nhập người dùng
- Định dạng key nhất quán cho từng loại dữ liệu

## Xóa Cache Chủ Động

Khi dữ liệu thay đổi (đặt vé, cập nhật lịch chiếu, v.v.), cache liên quan sẽ bị xóa ngay để đảm bảo dữ liệu luôn mới.
