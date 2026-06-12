# Checklist Refactor & Clean Architecture

## Nhánh đang làm việc: `feature/refactor-schema`

- `[/]` **Giai đoạn 1: Refactor Database Schema (Entities & Fluent API)**
  - `[x]` Cập nhật `UserInfoEntity.cs` (gộp các trường cá nhân từ `UserProfileEntity` sang, xóa navigation property).
  - `[x]` Cập nhật `RoleListInfoEntity.cs` (thêm `SalaryPerHour` và `DiscountPercent`).
  - `[x]` Tạo các Entity phân quyền: `PermissionEntity.cs`, `PermissionForRoleEntity.cs`.
  - `[x]` Tạo các Entity quản lý nhân viên & lương: `StaffProfileEntity.cs`, `StaffWorkingLoggerEntity.cs`, `StaffSalaryTotalLoggerEntity.cs`.
  - `[x]` Tạo các Entity đăng ký ca trực: `CinemaShiftTemplateEntity.cs`, `StaffShiftRegistrationEntity.cs`.
  - `[x]` Tạo Entity khách hàng: `CustomerProfileEntity.cs`.
  - `[x]` Cập nhật `OrderDetailsInfo.cs` (sửa kiểu `PriceEach`/`UnitPrice`, thêm `FullName`, `IdentityCodeHash`).
  - `[x]` Xóa file `UserProfileEntity.cs`.
  - `[x]` Cập nhật `CinemaDbContext.cs` (đăng ký các `DbSet` mới).
  - `[x]` Override `SaveChangesAsync` trong `CinemaDbContext.cs` để tự động hóa việc so sánh giá trị cũ/mới của Entity (Audit Log tự động).
  - `[x]` Cập nhật cấu hình Fluent API trong `DataAccess/RelationshipKeys` (xóa cấu hình UserProfile, thêm cấu hình cho các bảng Staff, Customer, Permission, Shift mới).

- `[ ]` **Giai đoạn 2: Seed Data Permissions & Shift Templates**
  - `[x]` Tạo `DataAccess/Constants/userPermissions.cs` lưu hằng số Guid cho các quyền.
  - `[x]` Tạo `DataAccess/SeedData/PermissionsSeedData.cs` để cấu hình seed permissions và phân quyền cho các roles.
  - `[ ]` Tạo seed data mẫu cho ca trực `CinemaShiftTemplateEntity` (Ca sáng, ca chiều, ca tối cho cụm rạp seed).
  - `[x]` Cấu hình gọi Seed Data mới trong `CinemaDbContext.OnModelCreating`.

- `[ ]` **Giai đoạn 3: Cập nhật JWT Payload với Permissions**
  - `[ ]` Cập nhật `Jwt_helper.Encrypt` trong `JwtService.cs` để mã hóa danh sách permissions vào token.
  - `[ ]` Cập nhật `LoginRegularUseCase.cs` để lấy danh sách permissions từ DB khi user đăng nhập thành công và truyền vào JWT.
  - `[ ]` Cập nhật `GoogleLoginUseCase.cs` để lấy danh sách permissions từ DB khi đăng nhập qua Google thành công và truyền vào JWT.

- `[ ]` **Giai đoạn 4: Đăng ký Ca trực & Khóa chống Race Condition (Redis)**
  - `[ ]` Tích hợp kết nối Redis Client (`StackExchange.Redis`).
  - `[ ]` Thiết lập dịch vụ khóa phân tán Redis Lock Helper.
  - `[ ]` Tạo Use Case Đăng ký ca làm (`RegisterShiftUseCase`) áp dụng khóa Redis để giới hạn lượt đăng ký và ngăn chặn race condition.
  - `[ ]` Tạo Use Cases phê duyệt ca làm dành cho Quản lý rạp và Admin.

- `[ ]` **Giai đoạn 5: Khắc phục lỗi Biên dịch (Compile Errors) & Kiểm thử cục bộ**
  - `[/]` Sửa lỗi biên dịch ở các Use Cases / Services do xóa `UserProfileEntity` (đã xong phần Services, còn phần UseCases và Validators).
  - `[x]` Cập nhật các đoạn Seed Data nếu có (chuyển đổi seed data UserProfile trực tiếp vào UserInfo).
  - `[ ]` Chạy biên dịch dự án cục bộ (`dotnet build`) để đảm bảo không còn lỗi.

- `[ ]` **Giai đoạn 6: Xóa Migrations cũ & Docker EF Core Update**
  - `[ ]` Khởi chạy Docker container cho SQL Server (`docker compose up -d mssql`).
  - `[x]` Xóa database cũ trong Docker (`dotnet ef database drop --project DataAccess --startup-project ApiLayer -f`).
  - `[x]` Xóa sạch các file cũ trong thư mục `DataAccess/Migrations`.
  - `[ ]` Tạo migration Initial mới (`dotnet ef migrations add InitialRefactoredSchema`).
  - `[ ]` Cập nhật database (`dotnet ef database update --project DataAccess --startup-project ApiLayer`).

- `[ ]` **Giai đoạn 7: Thiết lập Clean Architecture (Repository & Unit of Work)**
  - `[ ]` Tạo các Interface cho Repository và Unit of Work trong `BusinessLayer/Interfaces`.
  - `[ ]` Triển khai Repository & Unit of Work cụ thể trong `DataAccess/Repositories`.
  - `[ ]` Đăng ký Dependency Injection trong `Program.cs`.

- `[ ]` **Giai đoạn 8: Chuyển đổi Use Caves sang Clean Architecture (Cuốn chiếu)**
  - `[ ]` Refactor nhóm IdentityAccess (`LoginRegularUseCase`, `RegisterRegularUseCase`) sang Repository.
  - `[ ]` Refactor các nhóm Use Cases khác (Booking, MovieManager...) theo lộ trình cuốn chiếu.

- `[x]` **Giai đoạn 9: Tài liệu dự án**
  - `[x]` Tạo tài liệu cấu trúc dự án và API endpoints (`project_structure_api_endpoints.md`).
  - `[x]` Tạo tài liệu tích hợp API cho FE (`api_integration_guide_fe.md`).
