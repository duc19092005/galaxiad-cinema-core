# 🎬 RENEW CINEMA PROJECT - TÀI LIỆU BACKEND CHO FRONTEND

> Hệ thống Backend Web API quản lý và đặt vé Rạp chiếu phim được xây dựng theo kiến trúc **Clean Architecture** sử dụng **C# .NET 8**.

---

## 📖 GIỚI THIỆU CHUNG (OVERVIEW)

Đây là repository chứa toàn bộ mã nguồn Backend cho hệ thống **Renew Cinema**. Hệ thống cung cấp API cho phía Client (Web/Mobile) và Dashboard quản lý để thực hiện các nghiệp vụ: đặt vé trực tuyến, quản lý rạp phim, thanh toán VNPAY, theo dõi trạng thái ghế Real-time, và kiểm soát lịch chiếu tự động qua Background Jobs.

---

## 🛠 CÔNG NGHỆ VÀ KIẾN TRÚC (TECH STACK & ARCHITECTURE)

Dự án áp dụng chặt chẽ mô hình **Clean Architecture**, tách biệt các lớp để đảm bảo khả năng mở rộng (Scale) và bảo trì (Maintenance).

* **Framework:** C# .NET 8 Web API
* **Kiến trúc:** Clean Architecture (ApiLayer, BusinessLayer, DataAccess, Shared)
* **Design Patterns:** DI (Dependency Injection), Repository Pattern, Factory Pattern, Mediator Pattern
* **Cơ sở dữ liệu (Database):** SQL Server, giao tiếp thông qua Entity Framework Core (EF Core)
* **Real-time Communication:** SignalR (đồng bộ trạng thái ghế đặt trong lúc thực hiện Booking)
* **Job Scheduling:** Hangfire & IHostedService (Auto update trạng thái phim, xoá phiên Booking hết hạn)
* **Authentication / Authorization:** JWT Bearer (Role-Based Access Control) & Google OAuth2
* **Payment Gateway:** VNPAY Integration
* **Lưu trữ Media:** Cloudinary API

---

## 📁 CẤU TRÚC DỰ ÁN CHI TIẾT (PROJECT DIRECTORY STRUCTURE)

Hệ thống được chia thành 4 thư mục lớn đại diện cho 4 tầng của Clean Architecture:

```text
RenewCinema_Backend/
│
├── ApiLayer/                 # Tầng Giao tiếp (Entry Point)
│   ├── Bootstraps/           # Chứa các Extension methods đăng ký Dependency Injection cho từng Module
│   ├── Controllers/          # API Controllers định tuyến Request
│   ├── Hubs/                 # Các SignalR Hubs xử lý Real-time (ví dụ: SeatHub)
│   ├── Middlewares/          # Nơi bắt lỗi Global Exceptions, Localization, v.v.
│   ├── Properties/           # Cấu hình file LaunchSettings
│   ├── appsettings.json      # File config (Database Connection, JWT, OAuth, VNPAY, v.v.)
│   └── Program.cs            # File gốc để start server, kết nối các Service
│
├── BusinessLayer/            # Tầng Nghiệp vụ (Business Logic)
│   ├── Dtos/                 # Data Transfer Objects (Requests/Responses API)
│   ├── Factories/            # Khởi tạo đối tượng phức tạp
│   ├── Interfaces/           # Các abstractions/contracts cho Services, Repositories, Mediator
│   ├── Services/             # Cài đặt logic nghiệp vụ chính (Booking, Movie, Validation...)
│   ├── UseCases/             # Các luồng Use Case thực thi độc lập (tuân theo Mediator)
│   └── Validators/           # Chứa logic kiểm tra tính đúng đắn của dữ liệu đầu vào
│
├── DataAccess/               # Tầng Kết nối Dữ liệu (Infrastructure)
│   ├── Constants/            # Các hằng số liên quan đến Database (Role, Policy...)
│   ├── Entities/             # Các Class Model đại diện cho các Bảng trong SQL (Map theo EF Core)
│   ├── Migrations/           # Chứa các file sinh tự động bởi EF Core để update cấu trúc Bảng
│   ├── RelationshipKeys/     # Cấu hình khóa ngoại, mapping relationship bằng Fluent API
│   ├── SeedData/             # Dữ liệu mẫu ban đầu (seeding data) khi mới tạo Database
│   └── CinemaDbContext.cs    # Lớp DbContext quản lý kết nối và truy vấn DB
│
├── Shared/                   # Tầng Dùng chung (Cross-cutting Concerns)
│   ├── Enums/                # Các kiểu liệt kê (Status, Type,...)
│   ├── Exceptions/           # Định nghĩa các Custom Exception cho dự án
│   ├── Localization/         # Nơi cấu hình đa ngôn ngữ (nếu có)
│   ├── MappingEnums/         # Mapping các enum logic
│   └── Utils/                # Helper, Utilities cho việc xử lý chuỗi, thời gian, JWT, v.v.
│   
└── Backend.sln               # File Solution của Visual Studio / Rider
```

---

## 👥 PHÂN HỆ VÀ QUYỀN HẠN (MODULES & ROLES)

Hệ thống được chia nhỏ thành nhiều API và được phân tách qua Swagger Document phục vụ từng nghiệp vụ:

### 1. Phân hệ Khách hàng (User Role / Public)
* Đăng ký, đăng nhập JWT, đăng nhập Google OAuth.
* Lấy danh sách phim chiếu (Now-Showing, Coming-Soon).
* Xem Lịch chiếu, sơ đồ ghế phòng vé.
* Đặt vé và Thanh toán VNPay (Real-time trạng thái ghế qua SignalR cho phép khóa ghế tạm thời).

### 2. Phân hệ Quản lý Rạp Phim (Theater Manager Role)
* Nơi quản lý trực tiếp Lịch Chiếu (Schedules) cho khu vực Rạp.
* Chứa Thuật toán **Dọn Dẹp Rạp (Breakdown Time)**: Phim bị chặn Overlap (trùng giờ), các suất chiếu của cùng một phòng phải tự động giãn cách tối thiểu 15 phút.

### 3. Phân hệ Quản trị hệ thống (Admin & Các Role chuyên biệt khác)
* **Admin:** Quản lý User (Khóa tài khoản), Cấu hình hệ thống, theo dõi và quản lý các lịch trình Background Job. Quản lý quy định Xóa Mềm - Xóa Cứng toàn bộ Dữ liệu.
* **Movie Manager:** Quản lý kho phim (Title, Genre, Runtime), quản lý dàn danh sách diễn viên.
* **Facilities Manager:** Quản lý cơ sở vật chất rạp (Thêm sửa xóa Chi nhánh Rạp, Phòng chiếu, Sơ đồ ghế).

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY (LOCAL DEVELOPMENT)

### Yêu cầu tiên quyết:
1. Đã cài đặt **.NET SDK 8.0+**
2. Đã cài đặt **SQL Server** (hoặc dùng Docker SQL Server)
3. Cần thiết lập biến môi trường/config tương ứng tại file `appsettings.Development.json` (ví dụ Chuỗi kết nối Database).

### Các bước chạy dự án:

**Bước 1: Clone repo và di chuyển vào thư mục dự án**
```bash
git clone <repo_url>
cd renew_cinema_project_backend
```

**Bước 2: Phục hồi các Package phụ thuộc**
```bash
dotnet restore
```

**Bước 3: Chạy ứng dụng**
Quá trình khởi tạo Database và Migration sẽ tự động chạy ngầm ở file `Program.cs` vào lần khởi động đầu tiên, do đó bạn không cần phải chạy tay script tạo DB.
```bash
dotnet run --project ApiLayer
```

**Bước 4: Kiểm tra Gateway API**
* API sẽ mặc định lắng nghe tại: `http://localhost:5032` (hoặc cổng cấu hình trong `launchSettings.json`).
* Truy cập giao diện **Swagger UI** tại: `http://localhost:5032/swagger`
*(Ở góc trên bên phải khung UI Swagger, bạn có thể chuyển đổi **Select a definition** dropdown menu để xem các Endpoint tương ứng cho từng tính năng / User Role).*

---

## 📞 LIÊN HỆ & BÁO LỖI

* Nếu FE gặp vấn đề về API Route báo 404, vui lòng kiểm tra lại thiết lập CORS hoặc BaseURL trong axios. Back-end đã mở CORS cho `localhost` và proxy `vercel.app`.
* Trong trường hợp API Throw Exception bị ẩn thông tin, hãy xem log trực tiếp trên cửa sổ Terminal/Console mà backend đang chạy.
