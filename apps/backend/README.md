# 🎬 HỆ THỐNG QUẢN LÝ ĐẶT VÉ PHIM (CINEMA BOOKING PLATFORM) — API BACKEND

🌐 **Select Language:** ![VN](https://flagcdn.com/w20/vn.png) [Tiếng Việt](./README.md) • ![GB](https://flagcdn.com/w20/gb.png) [English](./README.en.md) • ![RU](https://flagcdn.com/w20/ru.png) [Русский](./README.ru.md)

---

> **Một giải pháp backend hiện đại, tối ưu hiệu năng và xử lý realtime dành cho các hệ thống rạp chiếu phim quy mô lớn.**

---

## 📌 Giới thiệu dự án
Hệ thống **Cinema Booking Backend** được phát triển trên nền tảng **ASP.NET Core 8** và **SQL Server**, cung cấp giải pháp API toàn diện cho việc vận hành chuỗi rạp chiếu phim. Hệ thống không chỉ giải quyết các nghiệp vụ bán vé, quản lý rạp mà còn tập trung tối ưu hóa trải nghiệm người dùng cuối qua xử lý thời gian thực (**Realtime**), tích hợp thanh toán điện tử an toàn, và tự động hóa các tác vụ quản trị.

Dự án được thiết kế theo cấu trúc **Pragmatic Clean Architecture**, đảm bảo tính mô-đun hóa cao, dễ dàng mở rộng, kiểm thử và bảo trì lâu dài.

---

## 🎯 Giá trị nghiệp vụ & Tính năng cốt lõi (Business Values & Core Features)

Hệ thống được thiết kế để giải quyết triệt để các bài toán thực tế của một doanh nghiệp vận hành rạp chiếu phim:

### 1. Trải nghiệm Đặt Vé & Thanh toán Mượt mà
*   **Đăng nhập đa phương thức:** Hỗ trợ đăng nhập truyền thống bảo mật cao bằng JWT (AccessToken & RefreshToken) cùng tích hợp **Google OAuth 2.0** tiện lợi cho người dùng.
*   **Hệ thống tra cứu thông tin phim:** Xem danh sách phim đang chiếu (Now-Showing), phim sắp chiếu (Coming-Soon), tra cứu lịch chiếu trực quan theo từng cụm rạp và ngày giờ cụ thể.
*   **Xử lý Giữ Ghế Realtime (SignalR Seat Locking):** Khi khách hàng chọn ghế và tiến hành thanh toán, hệ thống sẽ **khóa ghế tạm thời trong 10 phút** thông qua SignalR. Ghế sẽ đổi trạng thái realtime trên màn hình của tất cả người dùng khác, loại bỏ hoàn toàn tình trạng **Double Booking** (trùng lặp ghế). Nếu quá thời gian 10 phút khách hàng không hoàn tất thanh toán, hệ thống tự động giải phóng ghế qua Background Job.
*   **Cổng thanh toán điện tử:** Tích hợp trực tiếp cổng thanh toán trực tuyến **VNPay**, đảm bảo giao dịch diễn ra an toàn, minh bạch và tự động đối soát trạng thái giao dịch thông qua cơ chế callback bảo mật.

### 2. Thuật toán Quản lý Lịch chiếu Chống Trùng Lặp (Schedule Conflict Prevention)
*   **Thời gian Dọn Dẹp Rạp (Breakdown Time):** Hệ thống tích hợp thuật toán kiểm tra xung đột lịch chiếu tự động. Giữa các suất chiếu của cùng một phòng chiếu bắt buộc phải có khoảng nghỉ tối thiểu 15 phút (Breakdown Time) để dọn dẹp và chuẩn bị. Thuật toán ngăn chặn 100% tình trạng người quản lý rạp cấu hình trùng giờ hoặc đè lịch chiếu lên nhau.

### 3. Công cụ Tính Giá Vé Linh hoạt (Dynamic Seat Surcharge & Discount Engine)
Hệ thống không sử dụng bảng giá vé cố định cứng nhắc, mà tích hợp một **Bộ công cụ tính giá thông minh (Dynamic Engine)** nhằm tối ưu hóa doanh thu theo mô hình kinh doanh rạp phim hiện đại. Quy trình tính giá vé được chia làm hai giai đoạn độc lập:

1. **Giai đoạn 1: Áp dụng Phụ thu (Surcharge) theo định dạng phòng chiếu & cụm rạp**
   Giúp tối ưu hóa doanh thu trên mỗi ghế ngồi đối với các suất chiếu cao cấp hoặc phòng chiếu đặc biệt (ví dụ: IMAX, 3D, cụm rạp trung tâm).
   $$\text{Giá sau phụ thu} = \text{Giá gốc} \times \left(1 + \frac{\text{Phần trăm phụ thu}}{100}\right)$$
   *Phụ thu được cấu hình linh hoạt theo tổ hợp: `(Rạp chiếu, Định dạng phim 2D/3D/IMAX)`.*

2. **Giai đoạn 2: Áp dụng Ưu đãi Phân khúc Khách hàng (User Segment Discount)**
   Hệ thống tự động nhận diện phân khúc thành viên của khách hàng để áp dụng chương trình giảm giá tri ân, giúp tăng tỷ lệ giữ chân khách hàng (Customer Retention Rate).
   $$\text{Giá cuối cùng} = \text{Giá sau phụ thu} \times \left(1 - \frac{\text{Phần trăm ưu đãi}}{100}\right)$$
   *Mức ưu đãi được xác định tự động dựa trên phân khúc khách hàng: Standard (5%), Student (10%), hoặc VIP (15%).*

### 4. Phân hệ POS, Quản lý Phòng ban & Chấm công Chặt chẽ (POS, Cashier Department & Attendance Flow)
*   **Quản lý Phòng ban (Cashier Department):** Hỗ trợ tạo các phòng ban/quầy thu ngân độc lập cho từng rạp, tự động cấp tài khoản dùng chung (Shared POS Account) có role `Cashier`. Đồng bộ hóa trạng thái tài khoản (`AccountStatus = Banned`) và hồ sơ nhân sự (`WorkingStatus = false`) của quầy bằng Database Transaction ngay khi phòng ban bị xóa hoặc vô hiệu hóa.
*   **Điểm danh sinh trắc học (Biometric Face Match):** Nhân viên khi nhận ca trực tại máy POS chỉ cần quét mặt (so khớp Face Vector 128 chiều) để nhận phiên làm việc (Clock-In) và kết thúc ca trực (Clock-Out).
*   **Bán vé và ghi nhận lịch sử tại quầy (POS Checkout):** Tách biệt rõ ràng thực thể người bán (StaffId - tự động phân giải qua ca trực đang mở nếu FE không truyền) và người mua (UserId - tra cứu từ email thành viên để tích điểm thưởng và áp dụng giảm giá VIP/Student).

### 5. Bộ lọc dữ liệu theo Cụm rạp (Cinema-based Query Filtering)
*   **Quản lý phim thông minh:** Cho phép lọc danh sách phim của Movie Manager (`GET /api/movieManager/movies?cinemaId=...`) để chỉ hiển thị các bộ phim đã được phân bổ chiếu tại cụm rạp được chọn.
*   **Báo cáo Dashboard chi tiết:** Admin và Quản lý có thể lọc dữ liệu của toàn bộ màn hình Dashboard (`GET /api/v1/admin/dashboard/management?cinemaId=...`) để theo dõi doanh thu, biểu đồ lượng vé bán ra theo ngày/giờ, top phim hot, giao dịch và audit log của riêng rạp đó.

---

## 🔐 Tài khoản đăng nhập (Môi trường Dev / Seed Data)

> **Mật khẩu chung tất cả tài khoản:** `anhduc9a5`

| Vai trò | Email | Mô tả |
|---------|-------|-------|
| **Admin** | `admin@cinema.com` | Quản trị hệ thống (full quyền) |
| **Quản lý phim** | `movie.manager@cinema.com` | Quản lý nội dung phim |
| **Quản lý rạp** | `theater.manager@cinema.com` | Quản lý vận hành rạp + duyệt ca trực |
| **Quản lý CSVC** | `facilities.manager@cinema.com` | Quản lý cơ sở vật chất, tạo rạp |
| **Thu ngân (Vé)** | `quay_ve_01@cinema.com` | Bán vé tại quầy |
| **Thu ngân (Bắp nước)** | `quay_bapnuoc_01@cinema.com` | Bán bắp nước tại quầy |

> **Lưu ý:** Khi **tạo rạp mới** qua API `/api/facilities/cinema` (POST), hệ thống sẽ **tự động sinh tài khoản thu ngân** cho rạp đó với:
> - Email: `cashier_{CinemaId}@cinema.com`
> - Mật khẩu mặc định: `123456`
> - Quyền: `Cashier`

---

## 👥 Phân hệ & Hệ thống Quyền hạn (Roles & Permission System)

Hệ thống phân tách quyền truy cập chặt chẽ để đáp ứng hoạt động vận hành thực tế của chuỗi rạp với 6 vai trò (System Roles) riêng biệt:

| Vai trò | Quyền hạn & Nghiệp vụ |
| :--- | :--- |
| **Customer** *(Khách hàng)* | Tra cứu thông tin, đặt vé, thực hiện thanh toán VNPay, xem lịch sử giao dịch và tích lũy điểm thành viên. |
| **Admin** *(Quản trị viên)* | Quản lý tài khoản toàn hệ thống, cấu hình hệ thống, theo dõi vết lịch sử hoạt động (Audit Logs) và phân quyền nhân viên. |
| **MovieManager** *(Quản lý phim)* | Quản lý danh mục phim, định dạng phim, đăng tải poster/banner (tích hợp Cloudinary) và thiết lập thông tin phim. |
| **TheaterManager** *(Quản lý lịch chiếu)* | Điều phối và lên lịch chiếu cho phòng chiếu tại rạp. Hệ thống tự động áp dụng thuật toán chống đè lịch chiếu. |
| **FacilitiesManager** *(Quản lý hạ tầng)* | Quản lý cơ sở vật chất rạp: sơ đồ ghế (Standard/VIP/Couple), danh sách phòng chiếu, trang thiết bị. |
| **Cashier** *(Thu ngân tại quầy)* | Hỗ trợ khách hàng mua vé và thanh toán trực tiếp tại quầy (Offline checkout flow). |

> 💡 **Điểm sáng Thiết kế:** `VIP` và `Student` **không phải là Role** truy cập hệ thống, mà là **Phân khúc khách hàng (User Segment)**. Thiết kế này giúp hệ thống tách biệt hoàn toàn giữa **Quyền hạn truy cập** (Role) và **Chính sách ưu đãi** (Pricing & Loyalty Segment), giúp tăng tính mở rộng khi cần thêm các phân khúc mới (ví dụ: Senior, Child).

### Các Phân khúc Khách hàng & Chính sách Ưu đãi:
*   **Standard Member:** Giảm 5% giá vé, tích lũy điểm hệ số 1x (Tự động gán khi đăng ký).
*   **VIP Member:** Giảm 15% giá vé, tích lũy điểm hệ số 2x (Được nâng cấp dựa trên mức chi tiêu).
*   **Student (Học sinh/Sinh viên):** Giảm 10% giá vé, tích lũy điểm hệ số 1.5x.

---

## 🛠️ Công nghệ Sử dụng & Điểm mạnh Kỹ thuật (Tech Stack & Architecture)

Hệ thống được phát triển với sự chú trọng cao về chất lượng code, khả năng mở rộng và bảo mật:

### 1. Danh mục Công nghệ (Tech Stack)
*   **Ngôn ngữ & Framework:** C# / .NET 8, ASP.NET Core Web API
*   **Cơ sở Dữ liệu & ORM:** MS SQL Server, Entity Framework Core 8
*   **Xử lý Realtime:** SignalR Hubs
*   **Tác vụ ngầm (Background Jobs):** Hangfire (quản lý việc tự động hủy vé quá hạn giữ ghế)
*   **Dịch vụ Bên thứ ba (3rd-party Services):**
    *   **VNPay:** Cổng thanh toán trực tuyến
    *   **Cloudinary:** Lưu trữ và tối ưu hóa hình ảnh poster phim bảo mật
    *   **Google OAuth 2.0:** Xác thực tài khoản người dùng nhanh
*   **Tài liệu hóa API:** Swagger OpenAPI (Được phân nhỏ tài liệu theo từng module giúp kiểm thử dễ dàng)

### 2. Kiến trúc Clean Architecture (4-Layer)

Sau quá trình refactor, hệ thống áp dụng **Clean Architecture chuẩn** với 4 project được tách biệt rõ ràng, tuân thủ nghiêm ngặt nguyên tắc **Dependency Inversion** — phụ thuộc chỉ hướng vào trong (inward-only):

```
Cinema.Api ──► Cinema.Infrastructure ──► Cinema.Application ──► Cinema.Domain
```

| Project | Vai trò | Phụ thuộc |
| :--- | :--- | :--- |
| **`Cinema.Domain`** | Lõi thuần nghiệp vụ: Entities, Enums, Exceptions, Domain Interfaces, Constants, Utils | *Không phụ thuộc ai* |
| **`Cinema.Application`** | Logic ứng dụng: Use Cases, DTOs, Application Interfaces (`IPasswordHasher`, `IJwtService`...) | `Cinema.Domain` |
| **`Cinema.Infrastructure`** | Hạ tầng cụ thể: EF Core, Repositories, Identity (BCrypt, JWT), Background Jobs, 3rd-party (VNPay, Cloudinary, Redis, DeepSeek AI) | `Cinema.Application` + `Cinema.Domain` |
| **`Cinema.Api`** | Presentation: Controllers, Middlewares, DI Bootstrap, Program.cs | `Cinema.Application` + `Cinema.Infrastructure` |

#### Cấu trúc thư mục chi tiết

```
Cinema.Domain/
├── Constants/          # Hằng số nghiệp vụ
├── Entities/           # EF Core Entities
├── Enums/              # Domain enumerations
├── Exceptions/         # Domain exceptions (AppException, UnauthorizeException...)
├── Interfaces/         # IRepository<T>, IUnitOfWork contracts
├── Localization/       # Messages & ILocalizationService
└── Utils/              # AES256Helper, DateTimeHelper...

Cinema.Application/
├── Constants/          # Application constants
├── Dtos/               # Request/Response DTOs
├── Interfaces/         # IJwtService, IPasswordHasher, IVnPayService...
├── UseCases/           # Business workflows (1 class = 1 use case)
└── Validators/         # Input validators

Cinema.Infrastructure/
├── BackgroundJobs/     # Hangfire jobs, MovieStatusSync, AiEmbedding services
├── Identity/           # BCryptPasswordHasher, JwtService, UserContextService
├── Persistence/        # CinemaDbContext, Migrations, SeedData
├── Repositories/       # EF Core Repository implementations
├── Services/           # VNPay, Cloudinary, Redis, DeepSeek AI, SSE, AuditLog
└── Utils/              # Infrastructure-level helpers

Cinema.Api/
├── Bootstraps/         # DI composition root (by module)
├── Controllers/        # HTTP Controllers
├── Hubs/               # SignalR SeatHub
├── Middlewares/        # Error & Localization middlewares
└── Program.cs          # Application entry point
```

### 3. Điểm cộng về Kỹ thuật của Backend
*   **Áp dụng Unit of Work & Repository Pattern:** Đảm bảo toàn bộ các thao tác thay đổi dữ liệu trong một phiên đặt vé (tạo order, cập nhật trạng thái ghế, trừ điểm) đều nằm trong một Database Transaction duy nhất. Tránh tuyệt đối tình trạng mất đồng bộ dữ liệu.
*   **Thiết kế Use Cases đơn nhiệm (Single Responsibility Principle - SRP):** Mỗi lớp nghiệp vụ (Use Case) chỉ chịu trách nhiệm cho một hành động duy nhất (ví dụ: `CreateCinemaUseCase`, `UpdateCinemaUseCase`, `DeleteCinemaUseCase` được tách thành các lớp và tệp riêng biệt thay vì gộp chung). Mỗi Use Case chỉ có duy nhất một phương thức thực thi công khai (thường là `ExecuteAsync`), giúp tối ưu hóa khả năng kiểm thử (Unit Test), dễ dàng bảo trì và cô lập nghiệp vụ khi có thay đổi. Các tác vụ nền (Hangfire Jobs) cũng được mô-đun hóa thành các Use Case riêng lẻ.
*   **Dependency Inversion cho Identity helpers:** `BCrypt` và `JWT` không được tham chiếu trực tiếp từ Application layer. Thay vào đó, Application định nghĩa interface `IPasswordHasher` và `IJwtService`; Infrastructure cung cấp implementation — giúp Application hoàn toàn độc lập với thư viện crypto bên thứ ba.
*   **Không phụ thuộc trực tiếp vào DbContext ở tầng nghiệp vụ:** Tầng Business chỉ giao tiếp qua interface `IUnitOfWork`, giúp hệ thống linh hoạt và có thể thay đổi nhà cung cấp cơ sở dữ liệu dễ dàng trong tương lai.
*   **Dockerized:** Đã sẵn sàng tệp Dockerfile và Docker Compose giúp triển khai hệ thống nhanh chóng chỉ với một dòng lệnh ở mọi môi trường.

---

## 📂 Tài liệu dành cho Lập trình viên (Developer Resources)

Nếu bạn là nhà phát triển muốn tìm hiểu sâu về cấu trúc code, cách cài đặt môi trường chạy thử hoặc đóng góp mã nguồn (contribution), vui lòng tham khảo các tài liệu chuyên sâu đặt tại thư mục nội bộ sau:

*   **[Kế hoạch triển khai kỹ thuật (Technical Implementation Plan)](./docs/dev/implementation_plan.md)**: Chi tiết thiết kế các lớp (classes), kiến trúc liên kết thực thể EF Core và sơ đồ luồng dữ liệu.
*   **[Bảng theo dõi công việc (Task Tracker)](./docs/dev/task.md)**: Danh sách chi tiết các công việc, trạng thái tiến độ refactor và các hạng mục đã hoàn thành.
*   **[Hướng dẫn tích hợp luồng POS, Phòng ban & Điểm danh (POS & Attendance Flow Integration Guide)](./README_POS_FLOW.md)**: Tài liệu chi tiết hướng dẫn Frontend tích hợp các API quản lý quầy, điểm danh khuôn mặt và liên kết nhân viên bán vé.

---

## 📈 Trạng thái Dự án (Build Status)
*   **Trạng thái Build:** ✅ Thành công 100% (`dotnet build` -> 0 errors, 0 warnings).
*   **Kiến trúc:** Đã hoàn thành refactor sang Clean Architecture 4-layer chuẩn (`Cinema.Domain` → `Cinema.Application` → `Cinema.Infrastructure` → `Cinema.Api`).
*   **Độ ổn định:** Đã áp dụng các bản vá cơ sở dữ liệu (migrations) cập nhật mới nhất, đảm bảo tính toàn vẹn dữ liệu cho các tính năng liên quan đến phân khúc khách hàng VIP.

