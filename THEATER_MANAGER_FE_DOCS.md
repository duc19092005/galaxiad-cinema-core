# TÀI LIỆU API CHO PHÂN QUYỀN THEATER MANAGER (QUẢN LÝ RẠP CHIẾU & LỊCH CHIẾU)

Tài liệu này cung cấp chi tiết về các Endpoint thuộc phân quyền `TheaterManager` để UI/UX Frontend tiến hành tích hợp màn hình Thêm, Sửa, Xoá Lịch Chiếu (CRUD). 

**Yêu cầu chung:** Các request đều phải đính kèm Header `Authorization: Bearer <token>` của tài khoản có Role `TheaterManager`. 
**Lỗi chung thường gặp:** Mọi trường hợp vi phạm quy tắc Logic Thời gian đều sẽ trả về HTTP Status `400 Bad Request` với mã lỗi tuỳ biến.

---

## BƯỚC CHUẨN BỊ (LẤY DỮ LIỆU ĐỔ VÀO COMBOBOX - SELECT CHO UI)

Trước khi thực hiện CRUD Thêm, Sửa Lịch chiếu, FE cần phải gọi 2 API sau để lấy tài nguyên tùy chọn (Option) nạp vào giao diện Chọn Phim và Chọn Phòng:

### Data 0.1: Lấy danh sách phim đang hoạt động kèm Định dạng (Movies with Formats)
* **Endpoint:** `GET /api/TheaterManager/Data/movies-with-formats`
* **Response Success**: Trả về Array Object cho phép FE nhóm (Group By) thông tin Formats theo Phim (Vì 1 Phim có thể có nhiều Formats ID để chọn chiếu).
```json
{
  "isSuccess": true,
  "data": [
    {
      "movieId": "4d1e0f2a-b7c8-d9e0-f1a2-000000000000",
      "movieName": "Avengers: End Game",
      "formatId": "2b30193e-83b3-c392-1192-000000000000",
      "formatName": "3D Phụ Đề"
    }
  ]
}
```

### Data 0.2: Lấy danh sách Phòng chiếu Rạp đang được Manager quản lý
* **Endpoint:** `GET /api/TheaterManager/Data/my-auditoriums`
* **Response:** Backend sẽ tự động Detect ManagerId hiện hành để lôi ra đích danh những phòng chiếu lệ thuộc.
* **Response Success**:
```json
{
  "isSuccess": true,
  "data": {
    "cinemaName": "Rạp Beta Mỹ Đình",
    "auditoriums": [
      {
        "auditoriumId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "auditoriumNumber": 1,
        "totalSeats": 85
      }
    ]
  }
}
```

---

## 0. LẤY DANH SÁCH LỊCH CHIẾU CỦA 1 PHÒNG (GET DATA)

Hiển thị toàn bộ lịch chiếu được gán cho một phòng chiếu cụ thể. Backend sẽ tự động check xem tài khoản đang đăng nhập có đúng là Quản lý của Rạp chiếu chứa phòng này hay không.

* **Endpoint:** `GET /api/TheaterManager/MovieSchedules/{auditoriumId}`
* **Params Path:** `auditoriumId`: ID của phòng chiếu cần check lịch.

* **Response Success**:
```json
{
  "isSuccess": true,
  "data": [
    {
      "scheduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "movieId": "4d1e0f2a-b7c8-d9e0-f1a2-000000000000",
      "movieName": "Avenger: End Game",
      "formatId": "2b30193e-83b3-c392-1192-000000000000",
      "formatName": "3D Phụ Đề",
      "auditoriumId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "startedDate": "2026-03-08T14:30:00.000Z",
      "endedTime": "2026-03-08T17:30:00.000Z",
      "isDeleted": false
    }
  ],
  "message": "Lấy danh sách lịch chiếu thành công."
}
```

---

## 1. TẠO MỚI LỊCH CHIẾU

Thêm hàng loạt suất chiếu cho một phòng chiếu cụ thể. Các suất chiếu phải tuân thủ nghiêm ngặt **Quy tắc Breakdown 15 Phút** (Dọn dẹp sau khi chiếu phim) và Không được phép đè lên (Overlap) các lịch đã có.

* **Endpoint:** `POST /api/TheaterManager/MovieSchedules`
* **Request Body:** `application/json`

```json
{
  "auditoriumId": "3fa85f64-5717-4562-b3fc-2c963f66afa6", // ID Phòng Chiếu
  "slots": [
    {
      "scheduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6", // (Có thể tự Gen random GUID từ FE)
      "movieId": "00000000-0000-0000-0000-000000000000",    // ID Phim
      "formatId": "00000000-0000-0000-0000-000000000000",   // Định dạng phim (2D, 3D...)
      "startedDate": "2026-03-08T14:30:00.000Z"             // Thời gian bắt đầu chiếu
    }
  ]
}
```

* **Các Rule (Lỗi trả về status 400)**:
  - Báo lỗi `"E02"`: "Phải có khoảng trống 15 phút giữa 2 lịch chiếu để dọn dẹp phòng rạp." (Nếu chính List Slots gửi lên bị đè nhau < 15p).
  - Báo lỗi `"E02"`: "Bị trùng lịch với một suất chiếu khác (Chưa tính 15 phút dọn dẹp)." (Nếu đè lịch với các lịch ĐÃ CÓ sẵn trong cơ sở dữ liệu).
  - Báo lỗi `"E01"`: "Không cho phép ngày trong quá khứ." (Thời gian `startedDate < DateTime.Now`).
  - Báo lỗi `"E01"`: Báo lỗi về giới hạn thời gian chiếu của Phim gốc `MovieAvailability`.

* **Response Success**:
```json
{
  "isSuccess": true,
  "data": null,
  "message": "Tạo lịch chiếu thành công"
}
```


---
## 2. CẬP NHẬT LỊCH CHIẾU THEO PHÒNG RẠP (UPDATE)

Dùng để chỉnh sửa một danh sách các suất chiếu đã tồn tại bên trong 1 phòng chiếu. Tương tự như thêm mới, vẫn kiểm tra chặt chẽ khoản cách thời gian (15 Phút Breakdown) & Overlap lịch.

* **Endpoint:** `PUT /api/TheaterManager/MovieSchedules/{auditoriumId}`
* **Params Path:** `auditoriumId`: ID của phòng chiếu hiện tại.
* **Request Body:** `application/json`

```json
{
  "slots": [
    {
      "scheduleId": "c8610731-b58a-4980-830a-999999999999", // EXACT ScheduleId đang có trên DB bạn muốn update
      "movieId": "4d1e0f2a-b7c8-d9e0-f1a2-000000000000",    // ID Phim Mới (nếu thay đổi)
      "formatId": "2b30193e-83b3-c392-1192-000000000000",   // Format Phim
      "startedDate": "2026-03-08T20:00:00.000Z"             // Giờ mới (nếu thay đổi)
    }
  ]
}
```

* **Các Rule (Lỗi trả về status 400)**:
  - Nếu `ScheduleId` đã truyền không nằm trong DB, throw lỗi "Lịch chiếu không tồn tại hoặc đã bị khóa."
  - Hàng loạt Error Message báo trùng lịch hệt như API tạo mới bên trên.

* **Response Success**:
```json
{
  "isSuccess": true,
  "data": null,
  "message": "Sửa lịch chiếu thành công"
}
```

---
## 3. XÓA LỊCH CHIẾU (SOFT DELETE)

API này thực hiện quy tắc **xoá mềm** lịch chiếu (Set `IsDeleted = true`).

* **Endpoint:** `DELETE /api/TheaterManager/MovieSchedules/{scheduleId}`
* **Params Path:** `scheduleId` : GUID của lịch chiếu cần xoá.

* **Điều Kiện và Lỗi:**
  - Nếu `scheduleId` không tìm thấy: Báo lỗi code 404.
  - Mã `"D01"`: "Lịch chiếu này đã bị xóa."
  - Mã `"D02"`: "Không thể xóa lịch chiếu chưa kết thúc." (Không cho phép xoá những lịch đang và sắp chiếu. Lịch đó phải đã kết thúc (tức là qua ngày/giờ đó) thì mới cho dọn).
  - Mã `"D03"`: "Không thể xóa lịch chiếu đã có người đặt vé thành công." (Quy chuẩn bảo toàn tính toàn vẹn vé của khách. Nếu vé failed/canceled thì Lịch chiếu ĐÓ vẫn xoá được bình thường để dọn dẹp hệ thống).

* **Response Success**:
```json
{
  "isSuccess": true,
  "data": null,
  "message": "Xóa lịch chiếu thành công."
}
```
