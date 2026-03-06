# TÀI LIỆU API CHO FRONTEND (CÁC TÍNH NĂNG ADMIN & THEATER MANAGER VỪA ĐƯỢC BỔ SUNG)

Tài liệu này hướng dẫn cách gọi và sử dụng các API liên quan đến:
1. Logic kiểm tra trùng lịch chiếu (Breakdown 15 phút).
2. Quy định xoá phim và lịch chiếu.
3. API Quản lý người dùng.
4. API Quản lý lịch chạy ngầm (Background Jobs).

---

## 1. QUẢN LÝ LỊCH CHIẾU (Breakdown 15 phút & Xoá lịch chiếu)

### 1.1 Thêm / Sửa lịch chiếu (Rule Breakdown 15 phút)

Khi FE thực hiện **Thêm mới lịch chiếu** hoặc **Cập nhật lịch chiếu**, Backend đã chặn cứng logic:
* Phải có khoảng **15 phút trống** giữa các bộ phim trong cùng **1 phòng chiếu** để nhân viên dọn dẹp.
* Tức là: `Thời gian bắt đầu phim sau >= Thời gian kết thúc phim trước + 15 phút`.

**Lưu ý cho FE xử lý:**
- Khi gọi API Add/Edit bị trùng, Backend sẽ trả về HTTP Status `400 Bad Request` với message: `"Bị trùng lịch với một suất chiếu khác (Chưa tính 15 phút dọn dẹp)."` hoặc `"Phải có khoảng trống 15 phút giữa 2 lịch chiếu để dọn dẹp phòng rạp."` (mã lỗi `E02`).
- FE cần hiển thị thông báo "Vui lòng để trống 15 phút giữa các suất chiếu" trên màn hình khi tạo lịch. Thậm chí có thể block thời gian trên TimePicker.

### 1.2 Xoá Lịch Chiếu (Delete Schedule)

* **Điều kiện được Xoá Mềm:** 
  * Phim đã chiếu qua (EndedTime < Now).
  * Chưa có ai đặt vé thành công (Nếu có đơn đặt nhưng đơn bị lỗi ở VNPAY/Canceled thì vẫn tính là thanh toán thất bại, nên vẫn được xoá mềm).
* **Điều kiện KHÔNG ĐƯỢC Xoá:** 
  * Lịch chiếu chưa kết thúc thời gian biểu.
  * Lịch chiếu đã có người thanh toán THÀNH CÔNG (Trạng thái `Booked`). Backend sẽ reject và ném lỗi 400.

**Response Error có thể nhận được (Code 400):**
- `"Lịch chiếu này đã bị xóa."`
- `"Không thể xóa lịch chiếu chưa kết thúc."`
- `"Không thể xóa lịch chiếu đã có người đặt vé thành công."`

---

## 2. QUẢN LÝ PHIM (Xoá Phim)

**Quy tắc:**
* Nếu bộ phim **chưa từng có khách đặt vé thành công** ở bất kỳ suất chiếu nào (hoặc khách ấn nhưng huỷ thanh toán): Backend sẽ tự động thực hiện **HARD DELETE (Xoá cứng)** - dọn sạch mọi thẻ phim, định dạng, thể loại, thông tin phim ra khỏi DB.
* Xin lưu ý với trường hợp bộ phim **ĐÃ QUÁ KHỨ VÀ CÓ NGƯỜI TỪNG ĐẶT VÉ THÀNH CÔNG**: Theo quy tắc bảo toàn dữ liệu tài chính (Khóa ngoại với Order), Backend chỉ tiến hành **SOFT DELETE (Xoá mềm)** tức là set biến `IsDeleted = true`. Phim biến mất trên Client nhưng vẫn tồn tại trong DB cho mục đích đối soát.

---

## 3. API QUẢN LÝ NGƯỜI DÙNG (USER MANAGEMENT)

Giao diện Admin Dashboard cần gọi các API sau để hiển thị/chặn người dùng. Phải gắn Header `Authorization: Bearer <token_of_admin>`

### 3.1 Lấy toàn bộ danh sách User
* **Method:** `GET`
* **Route:** `/api/v1/AdminManageUsers`
* **Response:** Array các `AdminUserDto`
```json
{
  "isSuccess": true,
  "message": "Get all users successfully.",
  "data": [
    {
      "userId": "guid...",
      "userEmail": "customer1@gmail.com",
      "fullName": "Nguyen Van A",
      "accountStatus": 1, // (1: Active, 2: Locked, 3: Banned...)
      "registerMethod": 1
    }
  ]
}
```

### 3.2 Khóa / Thay đổi trạng thái User
* **Method:** `PUT`
* **Route:** `/api/v1/AdminManageUsers/{userId}/status?status={STATUS_INT}`
* **Params:** 
  * `userId`: GUID của tài khoản cần đổi trạng thái.
  * `status`: Mã Integer quy chuẩn AccountStatusEnum của Backend (ví dụ FE có thể tự định tuyến quy tắc: 1 là Active, 2 là Block, 3 là Banned.. Xem bảng Enum của Backend).

### 3.3 Đổi quyền người dùng (Phân quyền Role)
* **Method:** `PUT`
* **Route:** `/api/v1/AdminManageUsers/{userId}/role?roleName={ROLE_NAME}`
* **Params:**
  * `userId`: GUID tài khoản cần thăng cấp.
  * `roleName`: `Admin` hoặc `TheaterManager` hoặc `User`...

### 3.4 Chuyển quyền quản lý Rạp phim (Assign Theater Manager)
Dùng để bàn giao 1 Rạp phim cụ thể cho một TheaterManager nắm trọn quyền thao tác Lịch chiếu và Phòng chiếu.
* **Method:** `PUT`
* **Route:** `/api/v1/AdminManageUsers/cinemas/{cinemaId}/manager?managerId={USER_ID}`
* **Params:**
  * `cinemaId`: Guid của Rạp Phim.
  * `managerId`: Guid của User đã được chỉ định role là TheaterManager.

---
## 4. API QUẢN LÝ BACKGROUND JOBS (SCHEDULE JOBS)

Hệ thống cung cấp sẵn khả năng tra cứu các lịch chạy Background (chuyển trạng thái phim tự động) cho Admin giám sát:

* **Method:** `GET`
* **Route:** `/api/v1/ScheduleJobs`
* **Response:**
```json
{
  "isSuccess": true,
  "data": [
    {
      "cronExpression": "0 0 * * *",
      "jobType": "Movies", // Job chuyển phim sắp chiếu -> Phim đang chiếu
      "lastExecutionTime": "2026-03-01T00:00:00",
      "nextExecutionTime": "2026-03-02T00:00:00",
      "stateName": "Enqueued",    // Trạng thái (Đang chờ, Thành công, Lỗi...)
      "jobArguments": []
    }
  ],
  "message": ""
}
```
**Lưu ý:** Việc thêm lịch Background đã được Backend tự móc nối vào lúc Tạo Phim hay Cập Nhật Phim, FE chỉ lấy data để vẽ bảng log giúp IT Admin kiểm tra tác vụ chứ không cần gọi Post job thủ công.
