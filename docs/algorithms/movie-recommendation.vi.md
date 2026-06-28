# Thuật Toán Đề Xuất Phim

Tài liệu này giải thích thuật toán đề xuất phim cho khách hàng dựa trên hành vi.

## Tổng Quan

Hệ thống đề xuất phim hoạt động dựa trên ba tầng:
1. **Đề xuất dựa trên hành vi** — sử dụng Qdrant (vector database) để tìm phim tương tự dựa trên lịch sử xem của khách hàng
2. **Đề xuất dựa trên nội dung** — truy vấn SQL dựa trên thể loại, định dạng và độ tuổi
3. **Điểm dự phòng** — điểm mặc định khi không có đủ dữ liệu

## Quy Trình

1. Khi khách hàng đăng nhập, hệ thống tải lịch sử xem và thể loại yêu thích
2. Hệ thống tìm phim tương tự trong Qdrant
3. Nếu Qdrant không có đủ kết quả, SQL sẽ được sử dụng làm dự phòng
4. Điểm cuối cùng là tổng hợp của nhiều yếu tố
