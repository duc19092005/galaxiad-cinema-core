# 🎬 HỆ THỐNG QUẢN LÝ ĐẶT VÉ PHIM (CINEMA BOOKING PLATFORM) — API BACKEND

🌐 **Language / Ngôn ngữ:**
*   [Tiếng Việt (Vietnamese) 🇻🇳](file:///d:/Personal%20Datas/Cinema/Backend/renew_cinema_project_backend/README.md)
*   [English (Tiếng Anh) 🇬🇧](file:///d:/Personal%20Datas/Cinema/Backend/renew_cinema_project_backend/README.en.md)
*   [Русский (Tiếng Nga) 🇷🇺](file:///d:/Personal%20Datas/Cinema/Backend/renew_cinema_project_backend/README.ru.md)

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

### 3. Công cụ Tính Giá Vé Linh hoạt (Seat Surcharge Engine)
Hệ thống quản lý giá vé không theo dạng giảm giá cố định mà sử dụng cơ chế **Phụ thu Rạp & Định dạng (Surcharge Engine)** thông minh:
*   **Công thức tính giá linh hoạt:**
    $$\text{Giá cuối} = \text{Giá gốc} \times \left(1 + \frac{\text{Phần trăm phụ thu}}{100}\right)$$
*   Phụ thu được thiết lập chi tiết theo từng tổ hợp: `(Rạp chiếu, Định dạng phim 2D/3D/IMAX, Phân khúc khách hàng)`.

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

### 2. Kiến trúc Pragmatic Clean Architecture
Hệ thống áp dụng kiến trúc Clean Architecture được tinh giản tối ưu (Pragmatic), tách biệt rõ ràng các tầng nghiệp vụ:
*   **Domain & Business Layer:** Nơi chứa logic nghiệp vụ cốt lõi, hoàn toàn độc lập với công nghệ cơ sở dữ liệu và thư viện bên thứ ba. Nhờ đó, logic đặt vé hoặc tính giá có thể dễ dàng viết Unit Test độc lập.
*   **DataAccess Layer (Infrastructure):** Nơi triển khai các kết nối database, EF Core DbContext, Migrations và tích hợp các SDK bên thứ ba (VNPay, Cloudinary, Hangfire).
*   **ApiLayer (Presentation):** Tầng giao tiếp client-server, xử lý request pipeline, phân quyền qua JWT Middleware và định tuyến SignalR Hubs.
*   **Shared Layer:** Chứa các cấu trúc dùng chung như các Exception tự định nghĩa, Helper dùng chung, và các Interface cho mẫu thiết kế Unit of Work (`IUnitOfWork`).

### 3. Điểm cộng về Kỹ thuật của Backend
*   **Áp dụng Unit of Work & Repository Pattern:** Đảm bảo toàn bộ các thao tác thay đổi dữ liệu trong một phiên đặt vé (tạo order, cập nhật trạng thái ghế, trừ điểm) đều nằm trong một Database Transaction duy nhất. Tránh tuyệt đối tình trạng mất đồng bộ dữ liệu.
*   **Không phụ thuộc trực tiếp vào DbContext ở tầng nghiệp vụ:** Tầng Business chỉ giao tiếp qua interface `IUnitOfWork`, giúp hệ thống linh hoạt và có thể thay đổi nhà cung cấp cơ sở dữ liệu dễ dàng trong tương lai.
*   **Dockerized:** Đã sẵn sàng tệp Dockerfile và Docker Compose giúp triển khai hệ thống nhanh chóng chỉ với một dòng lệnh ở mọi môi trường.

---

## 📂 Tài liệu dành cho Lập trình viên (Developer Resources)

Nếu bạn là nhà phát triển muốn tìm hiểu sâu về cấu trúc code, cách cài đặt môi trường chạy thử hoặc đóng góp mã nguồn (contribution), vui lòng tham khảo các tài liệu chuyên sâu đặt tại thư mục nội bộ sau:

*   **[Kế hoạch triển khai kỹ thuật (Technical Implementation Plan)](file:///d:/Personal%20Datas/Cinema/Backend/renew_cinema_project_backend/docs/dev/implementation_plan.md)**: Chi tiết thiết kế các lớp (classes), kiến trúc liên kết thực thể EF Core và sơ đồ luồng dữ liệu.
*   **[Bảng theo dõi công việc (Task Tracker)](file:///d:/Personal%20Datas/Cinema/Backend/renew_cinema_project_backend/docs/dev/task.md)**: Danh sách chi tiết các công việc, trạng thái tiến độ refactor và các hạng mục đã hoàn thành.

---

## 📈 Trạng thái Dự án (Build Status)
*   **Trạng thái Build:** ✅ Thành công 100% (`dotnet build` -> 0 lỗi).
*   **Độ ổn định:** Đã áp dụng các bản vá cơ sở dữ liệu (migrations) cập nhật mới nhất, đảm bảo tính toàn vẹn dữ liệu cho các tính năng liên quan đến phân khúc khách hàng VIP.
