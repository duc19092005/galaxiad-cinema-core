# KẾ HOẠCH TRIỂN KHAI TỔNG THỂ (MASTER IMPLEMENTATION PLAN)
## Refactor Database Schema, JWT Permissions, Tự động Audit Logs, Đăng ký ca trực & Nhận diện khuôn mặt (Bảo mật AES-256)

Tài liệu này phác thảo toàn bộ thiết kế hệ thống, các thay đổi cơ sở dữ liệu, quy trình bảo mật và sơ đồ luồng hoạt động (Sequence Diagrams) dành cho Frontend (FE) và hội đồng đánh giá đồ án.

---

## 1. Sơ đồ Luồng hoạt động Hệ thống (System Flowcharts)

Để FE và người ngoài dễ dàng hình dung cơ chế hoạt động, dưới đây là sơ đồ Mermaid mô tả các quy trình cốt lõi:

### A. Luồng Đăng nhập & Phân quyền qua JWT (Login & Authorization Flow)
Mô tả cách thức đăng nhập, truy vấn quyền hạn và tự động đính kèm quyền vào JWT:

```mermaid
sequenceDiagram
    autonumber
    actor User as Nhân viên / Admin
    participant FE as Frontend App
    participant BE as Backend API
    participant DB as SQL Server
    participant Redis as Redis Cache

    User->>FE: 1. Nhập thông tin đăng nhập
    FE->>BE: 2. POST /regular-login
    BE->>DB: 3. Kiểm tra thông tin tài khoản (Active)
    DB-->>BE: 4. Trả về thông tin User
    BE->>DB: 5. Query Roles & Permissions tương ứng của User
    DB-->>BE: 6. Trả về danh sách Quyền (Ví dụ: SellTicket, ClockIn...)
    BE->>BE: 7. Mã hóa JWT (nhúng Email, UserId, Roles, Permissions vào Payload)
    BE->>BE: 8. Sinh ngẫu nhiên Refresh Token ngẫu nhiên (bảo mật)
    BE->>Redis: 9. Lưu Refresh Token (Key: user:rf:{UserId}:{Token}, TTL: 7 ngày)
    BE-->>FE: 10. Trả về HTTP 200 OK + Set Cookies (X-Access-Token & X-Refresh-Token)
    Note over FE: FE giải mã JWT bằng jwt-decode để lấy danh sách "permission" ẩn/hiện nút bấm trên UI.
```

---

### B. Luồng Đăng ký ca trực & Khóa chống Race Condition (Shift Registration & Redis Lock Flow)
Mô tả cơ chế khóa phân tán Redis để ngăn chặn tình trạng nhiều nhân viên đăng ký vượt quá số lượng tối đa (`MaxStaff`) của ca trực trong cùng một mili-giây:

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Nhân viên
    participant FE as Frontend App
    participant BE as Backend API
    participant Redis as Redis Cache (Lock Manager)
    participant DB as SQL Server

    Staff->>FE: 1. Chọn ca trực ngày D và nhấn "Đăng ký"
    FE->>BE: 2. POST /shifts/register (TemplateId, Date)
    BE->>Redis: 3. SET NX lock:shift:{TemplateId}:{Date} (Yêu cầu Khóa)
    alt Lấy Khóa thành công (Lock Acquired)
        Redis-->>BE: 4. Đồng ý cấp Khóa (TTL: 3000ms)
        BE->>DB: 5. Đếm số lượng đăng ký đã có của ca này ngày này
        DB-->>BE: 6. Trả về kết quả (Ví dụ: 1/2 vị trí đã đăng ký)
        alt Còn vị trí trống (Slot Available)
            BE->>DB: 7. Tạo bản ghi đăng ký mới (Trạng thái: Pending)
            BE->>Redis: 8. DEL lock:shift:{TemplateId}:{Date} (Giải phóng Khóa)
            BE-->>FE: 9. Trả về HTTP 200: Đăng ký thành công, chờ phê duyệt
        else Hết vị trí trống (Slot Full)
            BE->>Redis: 10. DEL lock:shift:{TemplateId}:{Date} (Giải phóng Khóa)
            BE-->>FE: 11. Trả về HTTP 400: Ca trực đã đầy chỗ
        end
    else Lấy Khóa thất bại (Lock Failed - Đang có request khác xử lý)
        BE->>BE: 12. Thử lại (Retry) sau 100ms
        Note over BE: Lặp lại bước yêu cầu khóa đến khi thành công hoặc quá thời gian chờ (500ms).
    end
```

---

### C. Luồng Điểm danh bằng Khuôn mặt & Giả lập Thời gian (Clock-In Face Recognition & Demo Flow)
Mô tả quy trình giải mã AES-256 Vector khuôn mặt để so khớp hình học và cơ chế hỗ trợ giả lập thời gian để demo cho giáo viên:

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Nhân viên quầy vé
    participant FE as Frontend POS (Webcam)
    participant BE as Backend API
    participant DB as SQL Server

    Staff->>FE: 1. Đứng trước camera POS và nhấn "Clock In"
    Note over FE: face-api.js mở webcam, phát hiện khuôn mặt và trích xuất Face Vector (mảng 128 số thực).
    FE->>BE: 2. POST /shifts/clock-in (FaceVector, simulatedDateTime)
    BE->>DB: 3. Lấy hồ sơ StaffProfile của Nhân viên
    DB-->>BE: 4. Trả về StaffProfile (FaceVector đã mã hóa AES)
    BE->>BE: 5. Giải mã FaceVector gốc từ DB bằng AES-256 (Decrypt)
    BE->>BE: 6. Tính khoảng cách hình học (Euclidean Distance) giữa Vector quét trực tiếp và Vector mẫu
    alt Khuôn mặt KHÔNG khớp (Khoảng cách >= 0.6)
        BE-->>FE: 7a. Trả về HTTP 400: Xác thực khuôn mặt thất bại
    else Khuôn mặt KHỚP (Khoảng cách < 0.6)
        BE->>BE: 8. Xác định thời gian hiện tại (Lấy simulatedDateTime nếu chạy thử, hoặc DateTime.Now thực tế)
        BE->>DB: 9. Truy vấn ca trực đã phê duyệt (Approved) của nhân viên cho ngày hôm đó
        alt Không đúng ca trực hoặc sai khung giờ
            BE-->>FE: 10a. Trả về HTTP 400: Không đúng ca trực hiện tại
        else Đúng ca trực
            BE->>DB: 11. Ghi nhận thời gian bắt đầu làm việc thực tế (StaffWorkingLogger)
            BE-->>FE: 12. Trả về HTTP 200: Điểm danh vào ca thành công!
        end
    end
```

---

### D. Luồng Tự động ghi Audit Logs thay đổi Dữ liệu (Automatic Field-Level Audit Log Flow)
Mô tả cách thức ghi lại lịch sử thay đổi đến từng cột dữ liệu khi Admin hoặc Manager thực hiện cập nhật hệ thống:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên
    participant FE as Frontend Admin
    participant BE as Backend API
    participant Context as EF Core CinemaDbContext
    participant DB as SQL Server

    Admin->>FE: 1. Chỉnh sửa giá vé định dạng từ 50,000đ thành 60,000đ
    FE->>BE: 2. PUT /api/v1/Formats/update
    BE->>Context: 3. Tìm bản ghi, gán giá trị mới và gọi SaveChangesAsync()
    Note over Context: Hàm SaveChangesAsync() bị ghi đè (override) tự động kích hoạt.
    Context->>Context: 4. Quét qua ChangeTracker tìm thực thể bị sửa đổi (Modified)
    Context->>Context: 5. So sánh thuộc tính: OriginalValue ("50000") và CurrentValue ("60000")
    Context->>Context: 6. Tạo văn bản mô tả thay đổi: "[BasePrice]: '50000' -> '60000'"
    Context->>Context: 7. Lấy Claims từ IHttpContextAccessor (UserId, UserName, Role của Admin)
    Context->>Context: 8. Chèn một bản ghi mới vào DbSet<AuditLogEntity> chứa các mô tả thay đổi trên
    Context->>DB: 9. Lưu toàn bộ thay đổi dữ liệu gốc + Dữ liệu Logs vào DB trong cùng một Transaction
    DB-->>Context: 10. Lưu thành công
    BE-->>FE: 11. Trả về HTTP 200: Cập nhật thành công
```

---

## 2. Kế hoạch Refactor Cơ sở dữ liệu Chi tiết

### Cập nhật các Entity hiện có (DataAccess)
1.  **`UserInfoEntity.cs` (Sửa đổi)**:
    *   Tích hợp trực tiếp các trường cá nhân: `UserName`, `IdentityCode`, `DateOfBirth`, `PhoneNumber`.
    *   Xóa liên kết tới bảng `UserProfileEntity`.
2.  **`RoleListInfoEntity.cs` (Sửa đổi)**:
    *   Thêm `SalaryPerHour` (decimal) và `DiscountPercent` (decimal).
3.  **`OrderDetailsInfo.cs` (Sửa đổi)**:
    *   Thêm `FullName` (nvarchar), `IdentityCodeHash` (varchar). Đảm bảo `PriceEach` dùng kiểu `decimal(18,2)`.

### Tạo mới các Entity phục vụ tính năng mới (DataAccess)
1.  **`PermissionEntity.cs` (Mới)**: Danh mục quyền hạn.
2.  **`PermissionForRoleEntity.cs` (Mới)**: Bảng liên kết trung gian nhiều-nhiều giữa Roles và Permissions.
3.  **`StaffProfileEntity.cs` (Mới)**: 
    *   `UserId` (PK/FK trỏ sang User)
    *   `WorkingStatus` (bool)
    *   `CinemaId` (Guid, rạp làm việc chính)
    *   `IsCinemaManager` (bool)
    *   `FaceVector` (nvarchar(max), **Mã hóa AES-256**)
4.  **`CustomerProfileEntity.cs` (Mới)**:
    *   `UserId` (PK/FK trỏ sang User)
    *   `TotalPoint` (decimal)
5.  **`CinemaShiftTemplateEntity.cs` (Mới)**: Khung giờ mẫu ca làm việc.
    *   `ShiftTemplateId` (Guid, PK)
    *   `CinemaId` (Guid, FK)
    *   `ShiftName`, `StartTime`, `EndTime`, `MaxStaff`, `RoleId` (vị trí công việc yêu cầu).
6.  **`StaffShiftRegistrationEntity.cs` (Mới)**: Đăng ký ca trực của nhân viên.
    *   `ShiftRegistrationId` (Guid, PK)
    *   `StaffId`, `ShiftTemplateId`, `RegistrationDate`
    *   `Status` (Pending, Approved, Rejected)
    *   `ApprovedByUserId` (Guid?), `ApprovedAt`, `Notes`
7.  **`StaffWorkingLoggerEntity.cs` (Mới)**: Lịch sử chấm công ca trực thực tế.
    *   Ghi nhận giờ bắt đầu, giờ kết thúc, số giờ làm, số tiền lương nhận được trong ca và ID đợt chi trả lương (`SalaryTotalLoggerId`).
8.  **`StaffSalaryTotalLoggerEntity.cs` (Mới)**: Nhật ký đợt thanh toán lương cho nhân viên.

### Xóa bỏ (Delete)
*   Xóa file `UserProfileEntity.cs`.
*   Xóa toàn bộ thư mục `Migrations` cũ.

---

## 3. Kế hoạch Kiểm thử & Chạy lệnh CLI

Khi tiến hành chạy thực tế, ta mở Terminal chạy các lệnh sau:
1.  **Dọn dẹp DB cũ trong Docker:**
    ```bash
    dotnet ef database drop --project DataAccess --startup-project ApiLayer -f
    ```
2.  **Tạo migration Initial mới tinh:**
    ```bash
    dotnet ef migrations add InitialRefactoredSchema --project DataAccess --startup-project ApiLayer
    ```
3.  **Cập nhật cấu trúc DB mới vào SQL Server trong Docker:**
    ```bash
    dotnet ef database update --project DataAccess --startup-project ApiLayer
    ```
4.  **Biên dịch kiểm tra dự án:**
    ```bash
    dotnet build
    ```
