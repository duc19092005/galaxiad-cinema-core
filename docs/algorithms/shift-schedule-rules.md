# Quy Tắc & Ràng Buộc Phân Ca Làm Việc (Shift Scheduling)

Tài liệu này mô tả các giải thuật kiểm tra ràng buộc thời gian biểu, phân loại ca làm và cơ chế chuẩn hóa múi giờ cho nhân viên rạp chiếu phim Galaxiad.

---

## 1. Phân Loại Ca Làm (Shift Types)

Hệ thống quản lý ca làm việc chia làm 3 loại ca chính với các ràng buộc cứng về thời gian:

1. **Ca Full-time (Cố định 8 tiếng)**:
   - Khoảng thời gian từ lúc bắt đầu đến lúc kết thúc bắt buộc phải **đúng 8 tiếng** (`EndTime - StartTime == 8 hours`).
   - Có hỗ trợ tính ca làm việc qua đêm (vượt qua mốc 12 giờ đêm).
   - Ô nhập giờ kết thúc trên giao diện (Frontend) sẽ tự động bị khóa và tự cộng thêm 8 tiếng dựa trên giờ bắt đầu để tránh sai sót.

2. **Ca Part-time (Cố định 4 tiếng)**:
   - Khoảng thời gian từ lúc bắt đầu đến lúc kết thúc bắt buộc phải **đúng 4 tiếng** (`EndTime - StartTime == 4 hours`).
   - Ô nhập giờ kết thúc tự động khóa và tự cộng thêm 4 tiếng trên giao diện.

3. **Ca xoay (Rotating Shift - Linh hoạt)**:
   - Không giới hạn số tiếng, cho phép chọn thoải mái giờ bắt đầu và kết thúc.

---

## 2. Ràng Buộc Giờ Hoạt Động Của Rạp (06:00 - 02:00 Hôm Sau)

Rạp phim chỉ hoạt động từ **6 giờ sáng** hôm nay đến **2 giờ sáng** hôm sau (giờ địa phương Việt Nam - UTC+7). Tất cả các ca làm việc khởi tạo phải nằm trọn vẹn trong khung giờ này.

### Giải Thuật Kiểm Tra (Validation Algorithm)
Giả sử ca làm việc bắt đầu tại `Start` và kết thúc tại `End`:
1. Chuyển đổi thời gian về giờ địa phương Việt Nam (UTC+7).
2. Lấy ra ngày bắt đầu của ca làm (`Date`).
3. Khởi tạo mốc giới hạn dưới: `MinLimit = Date + 06:00`.
4. Khởi tạo mốc giới hạn trên: `MaxLimit = Date + 1 day + 02:00` (tức 2h sáng ngày hôm sau).
5. Điều kiện hợp lệ:
   $$\text{MinLimit} \le \text{Start} \le \text{MaxLimit}$$
   $$\text{MinLimit} \le \text{End} \le \text{MaxLimit}$$
6. Nếu vi phạm bất kỳ mốc nào, Backend và Frontend sẽ chặn hành động và thông báo lỗi.

---

## 3. Quy Tắc Đăng Ký Ca Theo Loại Nhân Viên (Staff Restrictions)

Để đảm bảo tối ưu chi phí vận hành và quyền lợi nhân viên, hệ thống áp dụng bộ lọc đăng ký ca:
- **Nhân viên Part-time**: Chỉ được phép đăng ký ca Part-time (4 tiếng) hoặc ca xoay có độ dài không vượt quá 4 tiếng.
- **Nhân viên Full-time**:
  - Được khuyến khích đăng ký ca Full-time (8 tiếng).
  - Nếu đăng ký ca ngắn hơn (< 8 tiếng), bắt buộc phải nhập lý do giải trình (`Notes`) trên hệ thống.

---

## 4. Chuẩn Hóa Múi Giờ (Timezone Normalization)

Hệ thống hoạt động trên môi trường phân tán, do đó múi giờ được chuẩn hóa như sau:
- **Client (Frontend)**: Nhận đầu vào giờ địa phương Việt Nam (UTC+7) của người dùng.
- **Backend (API)**:
  - Khi lưu vào Database: Sử dụng hàm `DateTimeHelper.NormalizeIncoming` để chuyển đổi toàn bộ giờ địa phương từ Frontend về giờ **UTC** chuẩn.
  - Khi xuất dữ liệu trả về Frontend: Sử dụng hàm `DateTimeHelper.ToVietnamTime` để tự động chuyển đổi dữ liệu UTC từ Database thành giờ địa phương **UTC+7** giúp hiển thị chính xác lịch làm cho nhân viên Việt Nam.
