# TÀI LIỆU BACKEND & API CHO FRONTEND - RENEW CINEMA PROJECT

Dưới đây là tổng hợp nhanh toàn bộ các phân hệ API của dự án Backend quản lý Rạp Phim, dành cho nhóm lập trình UI/UX Frontend tiến hành tham khảo và đấu nối.

## 📌 DANH SÁCH TÀI LIỆU DÀNH CHO TỪNG ROLE / NGHIỆP VỤ

Mỗi phần nghiệp vụ lớn đã được bóc tách viết thành các file Markdown độc lập để FE dễ tìm kiếm. Vui lòng ấn vào các Link bên dưới để xem chi tiết:

### 1. Phân hệ Booking Khách hàng (User Role / Public)
* Dành cho Website khách đặt vé, sơ đồ ghế phòng vé, thanh toán VNPay và thông báo tín hiệu Realtime SSE (Server-Sent Events).
👉 **Xem chi tiết tại:** [BOOKING_API_DOCS.md](./BOOKING_API_DOCS.md) | [BOOKING_FE_REALTIME_DOCS.md](./BOOKING_FE_REALTIME_DOCS.md) | [BOOKING_FE_TROUBLESHOOTING.md](./BOOKING_FE_TROUBLESHOOTING.md)

### 2. Phân hệ Quản lý hệ thống - Admin Role (Admin Dashboard)
* Dành cho Giám đốc/Admin tổng kiểm soát Trạng thái của các User.
* Chặn xử lý các lịch Background Job (Đang chạy ngầm tự động đổi Status phim chiếu).
* Quy tắc Xoá mềm - Xoá cứng bảo toàn tính nhất quán của dữ liệu.
👉 **Xem chi tiết tại:** [ADMIN_FE_DOCS.md](./ADMIN_FE_DOCS.md)

### 3. Phân hệ Quản lý Rạp Phim (Theater Manager Role)
* Dành cho các Quản lý rạp chiếu.
* Nơi xử lý trực tiếp các API CRUD Lịch Chiếu (Schedules), kiểm duyệt lịch xem có bị đè (Overlaps) hay không.
* **Đặc biệt lưu ý:** API quản lý Rạp phim sẽ áp dụng quy tắc chốt chặn của Luật *Dọn Dẹp Rạp*: Tất cả phim phải cách nhau đúng và đủ **ít nhất 15 phút** (Breakdown Time).
* API Lấy danh sách lịch trình (GET) cho một phòng chiếu.
👉 **Xem chi tiết tại:** [THEATER_MANAGER_FE_DOCS.md](./THEATER_MANAGER_FE_DOCS.md)

---

## 🛠️ CÁCH KHỞI CHẠY BACKEND CHO ĐỘI DEV

Dự án viết bằng C# .NET 8, tuân theo Clean Architecture chia lớp.

1. Hãy chắc chắn bạn đã cài đặt .NET SDK 8.0+.
2. Trong thư mục gốc của Backend, mở Terminal/PowerShell và thực thi lệnh sau:
   ```bash
   dotnet clean
   dotnet restore
   dotnet build
   dotnet run --project ApiLayer
   ```
3. API sẽ chạy ở cấu hình mặc định: `http://localhost:5032`
4. Truy cập giao diện Swagger tại: `http://localhost:5032/swagger` để xem toàn thể Endpoint dạng OpenAPI.
