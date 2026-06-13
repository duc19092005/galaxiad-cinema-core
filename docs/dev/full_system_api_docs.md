# TÀI LIỆU MASTER API - TOÀN BỘ HỆ THỐNG CINEMA BACKEND
## Hướng Dẫn Tích Hợp Toàn Diện Cho Frontend (FE) & Vận Hành Hệ Thống

Tài liệu này cung cấp toàn bộ chi tiết kỹ thuật về cấu trúc dữ liệu gửi lên (Request Body) và dữ liệu trả về (Response Body) của tất cả các API trong hệ thống, giúp lập trình viên Frontend (FE) tích hợp giao diện dễ dàng và chính xác.

---

## 1. CẤU TRÚC PHẢN HỒI CHUẨN CỦA BACKEND (BaseResponse)
Tất cả các API trong hệ thống (trừ các trường hợp đặc biệt như callback thanh toán hoặc tải file) đều trả về một định dạng JSON chuẩn hóa như sau:

```json
{
  "isSuccess": true, // true nếu xử lý thành công, false nếu gặp lỗi
  "message": "Thông điệp phản hồi bằng Tiếng Việt hiển thị cho người dùng",
  "data": null // Dữ liệu trả về (có thể là Object, Array, Boolean hoặc null)
}
```

> [!NOTE]
> Khi dữ liệu phản hồi trong trường `data` là rỗng (`null`), Backend sẽ tự động loại bỏ thuộc tính này để giảm tải băng thông mạng.

---

## 2. QUY TRÌNH ADMIN THIẾT LẬP TÀI KHOẢN NHÂN VIÊN
Quy trình thêm mới một tài khoản nhân viên được tiến hành theo **3 bước** tuần tự như sau:

### Bước 1: Tạo tài khoản định danh (Identity)
*   **API Endpoint:** `POST /api/v1/IdentityAccess/regular-register`
*   **Quyền truy cập:** Public
*   **Request Body (JSON):**
    ```json
    {
      "userEmail": "nhanvien01@cinema.com",
      "userPassword": "Password123@",
      "userRepassword": "Password123@",
      "userName": "Nguyễn Văn Thu Ngân",
      "identityCode": "001205123456", // Đúng 12 số CCCD
      "phoneNumber": "0987654321", // Đúng 10 số điện thoại
      "dateOfBirth": "2000-01-15T00:00:00Z" // Định dạng ISO 8601
    }
    ```
*   **Response Body (JSON):**
    ```json
    {
      "isSuccess": true,
      "message": "Đăng ký thành công",
      "data": true
    }
    ```

### Bước 2: Thăng cấp vai trò nhân viên (Assign Roles)
Admin lấy `UserId` nhận được từ danh sách User, tiến hành chỉ định vai trò nghiệp vụ.
*   **API Endpoint:** `PUT /api/v1/AdminManageUsers/{userId}/role`
*   **Quyền truy cập:** Chỉ có `Admin`
*   **Request Body (JSON):** Mảng chứa các GUID định danh Role.
    ```json
    [
      "a1b2c3d4-1111-1111-1111-111111111002" // ID của vai trò Cashier (ví dụ)
    ]
    ```
*   **Response Body (JSON):**
    ```json
    {
      "isSuccess": true,
      "message": "Role Assign Completed successfully.",
      "data": null
    }
    ```
*   *Lưu ý hệ thống:* Khi gán vai trò nhân sự, hệ thống tự động sinh bản ghi `StaffProfileEntity` liên kết tạm vào Chi nhánh rạp số 1.

### Bước 3: Cập nhật chi nhánh hoạt động thực tế
Quản lý hoặc Admin cập nhật chi nhánh hoạt động chính xác của nhân viên mới và trạng thái kích hoạt.
*   **API Endpoint:** `PUT /api/v1/TheaterManager/Shifts/staff-profiles/{id}` (với `{id}` là `UserId` của nhân viên)
*   **Quyền truy cập:** `Admin` hoặc `TheaterManager` quản lý cùng chi nhánh.
*   **Request Body (JSON):**
    ```json
    {
      "workingStatus": true, // true: đang làm việc, false: tạm nghỉ/ngừng hoạt động (Soft Delete)
      "cinemaId": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f", // GUID của Cinema chi nhánh
      "isCinemaManager": false // true nếu cất nhắc làm Trưởng ca/Quản lý rạp phụ
    }
    ```
*   **Response Body (JSON):**
    ```json
    {
      "isSuccess": true,
      "message": "Cập nhật thông tin nhân viên thành công.",
      "data": true
    }
    ```

---

## 3. CHI TIẾT ENDPOINTS, ĐẦU VÀO (REQUEST) & ĐẦU RA (RESPONSE)

### PHÂN VÙNG I: ĐĂNG NHẬP & TÀI KHOẢN (IDENTITY ACCESS)

#### 1. Đăng nhập hệ thống (Regular Login)
*   **API Endpoint:** `POST /api/v1/IdentityAccess/regular-login`
*   **Quyền:** Public
*   **Request Body:**
    ```json
    {
      "email": "nhanvien01@cinema.com",
      "password": "Password123@"
    }
    ```
*   **Response Body (200 OK):** (Trả về Token JWT và tự động đính kèm cookie HTTP-Only tên `X-Access-Token`)
    ```json
    {
      "isSuccess": true,
      "message": "Login Success",
      "data": {
        "userId": "e9c8f615-3a01-42f5-b28f-f9c3b8a18d24",
        "username": "Nguyễn Văn Thu Ngân",
        "roles": ["Cashier"],
        "managedCinemas": [] // Danh sách rạp quản lý (nếu có role TheaterManager)
      }
    }
    ```

#### 2. Lấy thông tin cá nhân hiện tại (Get Profile)
*   **API Endpoint:** `GET /api/v1/IdentityAccess/get-profile`
*   **Quyền:** Yêu cầu đăng nhập (JWT)
*   **Response Body (200 OK):**
    ```json
    {
      "isSuccess": true,
      "message": "Profile retrieved successfully",
      "data": {
        "userName": "Nguyễn Văn Thu Ngân",
        "identityCode": "001205123456",
        "dateOfBirth": "2000-01-15T00:00:00",
        "phoneNumber": "0987654321",
        "roles": ["Cashier"]
      }
    }
    ```

#### 3. Cập nhật thông tin cá nhân (Update Profile)
*   **API Endpoint:** `PUT /api/v1/IdentityAccess/update-profile`
*   **Quyền:** Yêu cầu đăng nhập (JWT)
*   **Request Body:**
    ```json
    {
      "userName": "Nguyễn Văn Thu Ngân (Cập Nhật)",
      "phoneNumber": "0987654322",
      "dateOfBirth": "2000-01-15T00:00:00Z"
    }
    ```
*   **Response Body:**
    ```json
    {
      "isSuccess": true,
      "message": "Profile updated successfully.",
      "data": true
    }
    ```

---

### PHÂN VÙNG II: QUẢN LÝ NHÂN SỰ & PHÂN QUYỀN (ADMIN USER MANAGEMENT)

#### 1. Lấy tất cả tài khoản trong hệ thống (Get All Users)
*   **API Endpoint:** `GET /api/v1/AdminManageUsers`
*   **Quyền:** Admin
*   **Response Body (200 OK):**
    ```json
    {
      "isSuccess": true,
      "message": "Get all users successfully.",
      "data": [
        {
          "userId": "e9c8f615-3a01-42f5-b28f-f9c3b8a18d24",
          "userEmail": "nhanvien01@cinema.com",
          "userName": "Nguyễn Văn Thu Ngân",
          "userRoles": "Cashier",
          "accountStatus": 0, // 0: Active, 1: Inactive, 2: Banned
          "registerMethod": 0 // 0: Regular, 1: Google
        }
      ]
    }
    ```

#### 2. Kích hoạt / Khóa tài khoản User (Set User Status)
*   **API Endpoint:** `PUT /api/v1/AdminManageUsers/{userId}/status`
*   **Quyền:** Admin
*   **Query Parameters:** `status` (kiểu số: `0`: Active, `1`: Inactive, `2`: Banned)
*   **Response Body:**
    ```json
    {
      "isSuccess": true,
      "message": "User status updated to Active successfully."
    }
    ```

#### 3. Thực hiện chuyển quyền quản lý (Transfer Management Rights)
Chuyển giao toàn quyền quản trị rạp/phim từ Quản lý cũ sang Quản lý mới.
*   **API Endpoint:** `POST /api/v1/admin/transfer-rights/execute`
*   **Quyền:** Admin
*   **Request Body:**
    ```json
    {
      "itemId": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f", // ID của Rạp hoặc Phim cần chuyển
      "sourceUserId": "8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d", // ID Quản lý cũ (có thể null nếu chưa được gán)
      "targetUserId": "e9c8f615-3a01-42f5-b28f-f9c3b8a18d24", // ID Quản lý mới nhận bàn giao
      "transferType": 2 // 1: Facilities, 2: Theater, 3: Movie
    }
    ```
*   **Response Body:**
    ```json
    {
      "isSuccess": true,
      "message": "Chuyển giao quyền quản lý thành công.",
      "data": true
    }
    ```

#### 4. Lấy tất cả quyền của hệ thống (Get All Permissions)
*   **API Endpoint:** `GET /api/v1/AdminManageUsers/permissions`
*   **Quyền:** Admin
*   **Response Body (200 OK):**
    ```json
    {
      "isSuccess": true,
      "message": "Lấy danh sách quyền thành công.",
      "data": [
        {
          "permissionId": "a1b2c3d4-1111-1111-1111-111111111001",
          "permissionInfo": "ViewCinema"
        }
      ]
    }
    ```

#### 5. Lấy danh sách vai trò và ánh xạ quyền tương ứng (Get Roles & Permissions)
*   **API Endpoint:** `GET /api/v1/AdminManageUsers/roles-permissions`
*   **Quyền:** Admin
*   **Response Body (200 OK):**
    ```json
    {
      "isSuccess": true,
      "message": "Lấy danh sách vai trò và quyền thành công.",
      "data": [
        {
          "roleId": "2c7b9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
          "roleName": "Cashier",
          "permissions": [
            {
              "permissionId": "a1b2c3d4-1111-1111-1111-111111111010",
              "permissionInfo": "SellTicket"
            }
          ]
        }
      ]
    }
    ```

#### 6. Cập nhật danh sách quyền cho vai trò (Update Permissions for Role)
*   **API Endpoint:** `PUT /api/v1/AdminManageUsers/roles/{roleId}/permissions`
*   **Quyền:** Admin
*   **Request Body (JSON):** Mảng chứa các GUID của Permission.
    ```json
    [
      "a1b2c3d4-1111-1111-1111-111111111001",
      "a1b2c3d4-1111-1111-1111-111111111002"
    ]
    ```
*   **Response Body (200 OK):**
    ```json
    {
      "isSuccess": true,
      "message": "Cập nhật quyền cho vai trò Cashier thành công."
    }
    ```

---

### PHÂN VÙNG III: CƠ SỞ VẬT CHẤT (FACILITIES MANAGEMENT)

#### 1. Tạo chi nhánh rạp mới (Create Cinema)
*   **API Endpoint:** `POST /api/facilities/cinema`
*   **Quyền:** FacilitiesManager
*   **Request Body:**
    ```json
    {
      "cinemaName": "CGV Vincom Landmark 81",
      "cinemaLocation": "Tầng B1, Landmark 81, Quận Bình Thạnh",
      "cinemaCity": "Hồ Chí Minh",
      "cinemaHotlineNumber": "19006017",
      "cinemaDescription": "Cụm rạp hiện đại bậc nhất Việt Nam với màn hình IMAX lớn nhất.",
      "activeAt": "2026-06-20T00:00:00Z"
    }
    ```
*   **Response Body (200 OK):**
    ```json
    {
      "isSuccess": true,
      "message": "Tạo rạp phim thành công.",
      "data": {
        "cinemaId": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
        "cinemaName": "CGV Vincom Landmark 81"
      }
    }
    ```

#### 2. Thêm phòng chiếu và sơ đồ ghế (Create Auditorium & Seats)
Tạo phòng chiếu và thiết lập tọa độ XY của từng ghế trên màn hình hiển thị của khách hàng.
*   **API Endpoint:** `POST /api/facilities/auditorium`
*   **Quyền:** FacilitiesManager
*   **Request Body:**
    ```json
    {
      "auditoriumNumber": "Phòng Chiếu 01",
      "cinemaId": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
      "movieFormatId": [
        "2d000000-0000-0000-0000-000000000000" // Danh sách định dạng hỗ trợ (2D, 3D...)
      ],
      "addReqSeatsAuditoriumDto": [
        {
          "seatNumber": "A01",
          "coordX": 10.5, // Tọa độ X trên canvas vẽ sơ đồ ghế ở FE
          "coordY": 20.0, // Tọa độ Y trên canvas vẽ sơ đồ ghế ở FE
          "colIndex": 1,
          "rowIndex": 1
        },
        {
          "seatNumber": "A02",
          "coordX": 25.5,
          "coordY": 20.0,
          "colIndex": 2,
          "rowIndex": 1
        }
      ]
    }
    ```
*   **Response Body:**
    ```json
    {
      "isSuccess": true,
      "message": "Tạo phòng chiếu thành công.",
      "data": true
    }
    ```

---

### PHÂN VÙNG IV: QUẢN LÝ KHO PHIM (MOVIE MANAGER)

#### 1. Thêm phim mới (Create Movie)
*   **API Endpoint:** `POST /api/movieManager/movies`
*   **Quyền:** MovieManager
*   **Dữ liệu gửi lên (Content-Type: multipart/form-data):** Gửi kèm tệp ảnh poster.

| Tên key | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `MovieName` | `string` | Tên phim. |
| `MovieDescription` | `string` | Nội dung mô tả tóm tắt. |
| `MovieImage` | `File` (Binary) | Poster phim dạng file ảnh. |
| `StartedDate` | `string (DateTime)`| Ngày bắt đầu công chiếu tại hệ thống. |
| `EndedDate` | `string (DateTime)`| Ngày ngừng chiếu dự kiến. |
| `MovieRequiredAgeId` | `Guid` | GUID của độ tuổi yêu cầu (lấy từ API phân loại tuổi). |
| `MovieFormatIds` | `List<Guid>` | Các định dạng phim hỗ trợ (2D, 3D, IMAX...). |
| `MovieGenreIds` | `List<Guid>` | Danh sách ID các thể loại (Hành động, Hài hước...). |
| `CinemaIds` | `List<Guid>` | Danh sách rạp được phép công chiếu bộ phim này. |
| `Duration` | `int` | Thời lượng phim (phút). |
| `TrailerUrl` | `string` | Link nhúng video trailer Youtube. |
| `Director` | `string` | Đạo diễn phim. |
| `Actors` | `string` | Các diễn viên chính tham gia. |

*   **Response Body:**
    ```json
    {
      "isSuccess": true,
      "message": "Thêm phim thành công.",
      "data": true
    }
    ```

---

### PHÂN VÙNG V: ĐẶT VÉ & THANH TOÁN (BOOKING & VNPAY)

#### 1. Tạo đơn đặt vé và lấy link thanh toán VNPay
FE gửi thông tin ghế đã chọn và loại phân khúc khách hàng tương ứng của từng ghế để tính toán giá trị hóa đơn.
*   **API Endpoint:** `POST /api/v1/booking/create`
*   **Quyền:** Yêu cầu đăng nhập (JWT)
*   **Request Body:**
    ```json
    {
      "scheduleId": "5e4d3c2b-1a0f-9e8d-7c6b-5a4f3e2d1c0b", // ID suất chiếu
      "voucherId": null, // GUID voucher nếu áp dụng
      "customerName": "Trần Anh Đức",
      "customerEmail": "trananhduc@gmail.com",
      "customerAddress": "Hà Nội, Việt Nam",
      "seatSelections": [
        {
          "seatId": "e1f2g3h4-a5b6-7c8d-9e0f-1a2b3c4d5e6f", // GUID của ghế 1
          "userSegmentId": "77777777-7777-7777-7777-777777777777" // GUID phân khúc (Người lớn/Học sinh...)
        },
        {
          "seatId": "a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d", // GUID của ghế 2
          "userSegmentId": "88888888-8888-8888-8888-888888888888" // GUID phân khúc (Trẻ em...)
        }
      ]
    }
    ```
*   **Response Body (200 OK):**
    ```json
    {
      "isSuccess": true,
      "message": "Khởi tạo đơn hàng giữ ghế thành công. Vui lòng thanh toán qua cổng VNPay.",
      "data": {
        "orderId": "b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e", // ID hóa đơn
        "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=18000000...", // Link để FE redirect user sang thanh toán
        "totalPrice": 180000.00, // Tổng tiền sau chiết khấu (đơn vị VNĐ)
        "totalQuantity": 2, // Số lượng vé
        "orderDate": "2026-06-13T19:20:00Z"
      }
    }
    ```

---

### PHÂN VÙNG VI: CHẤM CÔNG & ĐIỂM DANH NHÂN VIÊN (STAFF SHIFTS)

#### 1. Đăng ký ca trực theo dải ngày (Register Shift)
*   **API Endpoint:** `POST /api/v1/Staff/Shifts/register`
*   **Quyền:** Yêu cầu đăng nhập (JWT)
*   **Request Body:**
    ```json
    {
      "shiftTemplateId": "a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d", // Ca sáng/tối...
      "startDate": "2026-06-15T00:00:00Z", // Bắt đầu từ ngày
      "endDate": "2026-06-21T00:00:00Z", // Kết thúc hết ngày
      "notes": "Đăng ký trực quầy bỏng nước tuần tới"
    }
    ```
*   **Response Body (200 OK):**
    ```json
    {
      "isSuccess": true,
      "message": "Đăng ký ca trực thành công cho 7 ngày đã chọn, đang chờ Quản lý phê duyệt.",
      "data": true
    }
    ```

#### 2. Đăng ký mẫu khuôn mặt khuôn mặt (Register Face Vector)
Chụp ảnh chân dung mẫu lưu khuôn mặt. Gửi 128 số thực vector trích xuất từ mô hình AI Face Recognition ở Client.
*   **API Endpoint:** `POST /api/v1/Staff/Shifts/{staffId}/register-face`
*   **Quyền:** Yêu cầu đăng nhập (JWT của quản lý hoặc nhân viên tự đăng ký)
*   **Request Body:**
    ```json
    {
      "faceVector": [
        0.0125, -0.0843, 0.1245, 0.0031, 0.0520, -0.1102, // ...đủ 128 số thực đặc trưng...
        0.0431, -0.0921, 0.0039, -0.0112, 0.0384, -0.0521
      ]
    }
    ```
*   **Response Body:**
    ```json
    {
      "isSuccess": true,
      "message": "Đăng ký nhận diện khuôn mặt thành công.",
      "data": true
    }
    ```

#### 3. Điểm danh vào ca làm việc tại quầy POS (Clock-In)
Nhân viên chọn tên và quét mặt tại màn hình khóa chung của máy POS. API này cho phép gọi ẩn danh vì phiên POS chung chưa thuộc tài khoản cá nhân.
*   **API Endpoint:** `POST /api/v1/Staff/Shifts/clock-in`
*   **Quyền:** Public (Không cần Bearer Token)
*   **Request Body:**
    ```json
    {
      "staffId": "e9c8f615-3a01-42f5-b28f-f9c3b8a18d24", // GUID nhân viên chọn trên giao diện
      "faceVector": [
        0.0120, -0.0840, 0.1250, 0.0030, 0.0522, -0.1100, // ...128 số quét thực tế từ camera...
        0.0430, -0.0920, 0.0040, -0.0110, 0.0380, -0.0520
      ],
      "simulatedDateTime": "2026-06-13T08:05:00Z" // Tùy chọn (để phục vụ test/giả lập giờ vào ca)
    }
    ```
*   **Response Body (200 OK - Khớp mặt thành công):**
    ```json
    {
      "isSuccess": true,
      "message": "Điểm danh vào ca thành công! Chào mừng Nguyễn Văn Thu Ngân vào ca làm việc.",
      "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWQiOiJlOWM4ZjYxNS...", // Token JWT riêng của nhân viên A để FE lưu trữ thực hiện bán vé
        "staffName": "Nguyễn Văn Thu Ngân"
      }
    }
    ```

#### 4. Điểm danh ra ca làm việc (Clock-Out)
Thực hiện khi kết thúc ca trực, tính lương cộng dồn ca đó.
*   **API Endpoint:** `POST /api/v1/Staff/Shifts/clock-out`
*   **Quyền:** Yêu cầu đăng nhập (JWT riêng của nhân viên đang làm việc ở POS)
*   **Request Body:**
    ```json
    {
      "simulatedDateTime": "2026-06-13T16:05:00Z" // Tùy chọn (giả lập giờ ra ca)
    }
    ```
*   **Response Body (200 OK):**
    ```json
    {
      "isSuccess": true,
      "message": "Điểm danh ra ca trực thành công! Số giờ làm việc: 8.0 giờ. Lương nhận được: 200,000 VNĐ.",
      "data": true
    }
    ```
    *Lưu ý ở FE:* Khi nhận được phản hồi này, FE lập tức xóa Token cá nhân trong bộ nhớ tạm để quay lại sử dụng Token của Tài khoản POS quầy chung.

---

### PHÂN VÙNG VII: DUYỆT LỊCH & QUẢN LÝ LƯƠNG (THEATER MANAGER SHIFTS)

#### 1. Tạo ca trực mẫu cho rạp (Create Shift Template)
*   **API Endpoint:** `POST /api/v1/TheaterManager/Shifts/templates`
*   **Quyền:** TheaterManager, Admin
*   **Request Body:**
    ```json
    {
      "cinemaId": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
      "shiftName": "Ca Sáng Thu Ngân",
      "startTime": "08:00:00", // Định dạng TimeSpan
      "endTime": "16:00:00",
      "maxStaff": 2,
      "roleId": "11111111-2222-3333-4444-555555555555" // Cấp bậc nhân sự được đăng ký
    }
    ```
*   **Response Body:**
    ```json
    {
      "isSuccess": true,
      "message": "Tạo ca trực mẫu thành công.",
      "data": {
        "shiftTemplateId": "a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d",
        "cinemaId": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
        "shiftName": "Ca Sáng Thu Ngân",
        "startTime": "08:00:00",
        "endTime": "16:00:00",
        "maxStaff": 2,
        "roleId": "11111111-2222-3333-4444-555555555555",
        "isActive": true
      }
    }
    ```

#### 2. Phê duyệt ca trực của nhân viên (Approve Shift)
*   **API Endpoint:** `POST /api/v1/TheaterManager/Shifts/registrations/{id}/approve` (với `{id}` là `ShiftRegistrationId` của bản ghi đăng ký)
*   **Quyền:** TheaterManager, Admin
*   **Request Body:**
    ```json
    {
      "notes": "Đã phê duyệt phân bổ quầy vé chính."
    }
    ```
*   **Response Body:**
    ```json
    {
      "isSuccess": true,
      "message": "Phê duyệt ca trực thành công.",
      "data": true
    }
    ```

#### 3. Từ chối ca trực nhân viên đăng ký (Reject Shift)
*   **API Endpoint:** `POST /api/v1/TheaterManager/Shifts/registrations/{id}/reject`
*   **Quyền:** TheaterManager, Admin
*   **Request Body:**
    ```json
    {
      "notes": "Từ chối vì ngày này ca làm đã đủ số người đăng ký."
    }
    ```
*   **Response Body:**
    ```json
    {
      "isSuccess": true,
      "message": "Từ chối yêu cầu đăng ký ca trực.",
      "data": true
    }
    ```

#### 4. Tính toán kết toán bảng lương (Calculate Payroll)
Gom toàn bộ lịch sử các ca làm hoàn thành nhưng chưa thanh toán lương của nhân sự để kết toán.
*   **API Endpoint:** `POST /api/v1/TheaterManager/Shifts/payroll/calculate`
*   **Quyền:** TheaterManager, Admin
*   **Request Body:**
    ```json
    {
      "staffId": "e9c8f615-3a01-42f5-b28f-f9c3b8a18d24",
      "upToDate": "2026-06-15T00:00:00Z" // Tính lương dồn đến mốc thời gian này
    }
    ```
*   **Response Body (200 OK):**
    ```json
    {
      "isSuccess": true,
      "message": "Tính lương thành công! Tổng số ca làm: 5, tổng số tiền: 1,000,000 VNĐ.",
      "data": {
        "salaryTotalLoggerId": "fa9f8e7d-6c5b-4a3f-2e1d-0c9b8a7f6e5d",
        "totalReceived": 1000000.00,
        "receivedDay": "2026-06-13T19:20:00Z",
        "staffId": "e9c8f615-3a01-42f5-b28f-f9c3b8a18d24",
        "staffName": "Nguyễn Văn Thu Ngân",
        "paidByUserId": null,
        "paidByName": null,
        "paymentStatus": "Pending", // Trạng thái hóa đơn chờ thanh toán
        "workingLogs": [
          {
            "staffWorkingLoggerId": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
            "salaryPerHour": 25000.00,
            "workingHour": 8.00,
            "startedShiftTime": "2026-06-12T08:00:00",
            "endedShiftTime": "2026-06-12T16:00:00",
            "workingDate": "2026-06-12T00:00:00",
            "totalReceived": 200000.00
          }
        ]
      }
    }
    ```

#### 5. Xác nhận chi thực tế đã thanh toán (Pay Payroll)
Đóng bảng lương đã được duyệt chi.
*   **API Endpoint:** `POST /api/v1/TheaterManager/Shifts/payroll/{id}/pay` (với `{id}` là `salaryTotalLoggerId` nhận được từ bước tính lương)
*   **Quyền:** TheaterManager, Admin
*   **Response Body:**
    ```json
    {
      "isSuccess": true,
      "message": "Xác nhận thanh toán thành công số tiền 1,000,000 VNĐ.",
      "data": true
    }
    ```

---

### PHÂN VÙNG VIII: LÊN LỊCH CHIẾU PHIM TẠI PHÒNG CHIẾU (MOVIE SCHEDULES)

#### 1. Lên lịch suất chiếu cho phòng chiếu (Create Movie Schedule)
*   **API Endpoint:** `POST /api/TheaterManager/MovieSchedules`
*   **Quyền:** TheaterManager, Admin
*   **Request Body:**
    ```json
    {
      "auditoriumId": "1e2f3g4h-a5b6-7c8d-9e0f-1a2b3c4d5e6f", // ID phòng chiếu
      "slots": [
        {
          "scheduleId": "00000000-0000-0000-0000-000000000000", // Gửi GUID rỗng để tạo mới
          "movieId": "d2c1b0a9-e8d7-c6b5-a4f3-2e1d0c9b8a7f", // ID phim
          "formatId": "2d000000-0000-0000-0000-000000000000", // Định dạng chiếu
          "startedDate": "2026-06-14T09:30:00Z" // Mốc giờ bắt đầu chiếu
        }
      ]
    }
    ```
*   **Response Body (200 OK):**
    ```json
    {
      "isSuccess": true,
      "message": "Lên lịch suất chiếu thành công.",
      "data": true
    }
    ```
