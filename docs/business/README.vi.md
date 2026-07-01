# Galaxiad Cinema — Quy Định Kinh Doanh

> **Phiên bản tài liệu:**
> - [English](README.en.md)
> - [Tiếng Việt (tập tin này)](README.vi.md)
> - [Русский](README.ru.md)

---

## 1. Tài Khoản & Kiểm Soát Truy Cập

| Mã | Tên Quy Định | Nội Dung |
|:--:|:-------------|:---------|
| **BS01** | Cấu hình chỉ dành cho Admin | Danh mục cơ sở vật chất, danh mục khoa/phòng và cấu hình hệ thống chỉ được thực hiện bởi tài khoản có quyền **Admin**. |
| **BS02** | Độ tuổi đăng ký Khách hàng | Một người phải ít nhất **16 tuổi** để đăng ký làm Khách hàng. |
| **BS03** | Độ tuổi đăng ký Nhân viên | Một người phải ít nhất **18 tuổi** để đăng ký làm Nhân viên. |
| **BS04** | Phương thức đăng ký | Có thể đăng ký qua **email/mật khẩu** hoặc qua **tài khoản Google**. |
| **BS05** | Truy cập dựa trên vai trò | Mỗi người dùng có một vai trò. Người dùng chỉ có thể xem và thực hiện các hành động phù hợp với quyền của vai trò đó. |
| **BS06** | Khóa tài khoản | **Admin** có thể khóa tài khoản người dùng. Lý do khóa phải được ghi lại. |
| **BS07** | Bảo mật phiên đăng nhập | Phiên đăng nhập sử dụng token bảo mật (JWT). Phiên tự động hết hạn. |
| **BS08** | Bảo mật khi thay đổi quyền | Nếu quyền của người dùng thay đổi trong phiên đang hoạt động, hệ thống sẽ đăng xuất họ vì lý do bảo mật. |

### Vai Trò Người Dùng

| Vai trò | Mô tả nghiệp vụ |
|:-------:|:----------------|
| **Customer (Khách hàng)** | Xem phim, đặt vé, viết đánh giá, quản lý đặt vé của mình |
| **Cashier (Thu ngân)** | Bán vé tại quầy, xử lý thanh toán cho khách đến mua trực tiếp |
| **Movie Manager (Quản lý phim)** | Thêm, sửa và xóa phim trong hệ thống |
| **Theater Manager (Quản lý rạp)** | Quản lý rạp chiếu, phòng chiếu, ca làm việc và lịch chiếu phim |
| **Facilities Manager (Quản lý cơ sở vật chất)** | Quản lý cơ sở vật chất rạp, sơ đồ phòng chiếu và thiết bị |
| **Admin** | Toàn quyền truy cập: quản lý người dùng, vai trò, chuyển giao quyền, voucher, quy tắc khuyến mãi và xem nhật ký kiểm toán |

---

## 2. Rạp Chiếu & Cơ Sở Vật Chất

| Mã | Tên Quy Định | Nội Dung |
|:--:|:-------------|:---------|
| **BS09** | Phân công quản lý rạp | Mỗi rạp chiếu có thể có một **Quản lý Rạp** và một **Quản lý Cơ sở vật chất** được phân công. |
| **BS10** | Hỗ trợ định dạng phòng chiếu | Một phòng chiếu có thể hỗ trợ một hoặc nhiều định dạng phim (2D, 3D, IMAX, 4DX, v.v.). |
| **BS11** | Sơ đồ ghế hoàn chỉnh | Sơ đồ ghế của phòng chiếu phải hoàn chỉnh. Các hàng và cột phải liên tục, không có khoảng trống bất thường. |
| **BS12** | Vị trí ghế duy nhất | Mỗi ghế trong phòng chiếu phải có vị trí lưới duy nhất. |
| **BS13** | Nhãn ghế duy nhất | Mỗi ghế phải có nhãn duy nhất. Hai ghế không thể cùng tên "A1". |
| **BS14** | Loại khoa/phòng | Một rạp chiếu có thể có các khoa/phòng như **Quầy Vé** và **Quầy Đồ ăn**. |
| **BS15** | Tài khoản dùng chung khoa/phòng | Mỗi khoa/phòng có một tài khoản đăng nhập dùng chung cho các thu ngân. |

---

## 3. Quản Lý Phim

| Mã | Tên Quy Định | Nội Dung |
|:--:|:-------------|:---------|
| **BS16** | Phân loại độ tuổi phim | Mỗi phim phải có phân loại độ tuổi. |
| **BS17** | Định dạng phim | Một phim có thể có nhiều định dạng (2D, 3D, IMAX, 4DX, v.v.). |
| **BS18** | Đang chiếu vs Sắp chiếu | Một phim được gắn cờ là **Đang Chiếu** hoặc **Sắp Chiếu**. |

### Phân Loại Độ Tuổi

| Nhãn | Ý nghĩa |
|:----:|:--------|
| **P** | Phù hợp với mọi lứa tuổi |
| **K** | Dưới 13 tuổi cần có cha mẹ hoặc người giám hộ đi kèm |
| **T13** | Dành cho khán giả từ 13 tuổi trở lên |
| **T16** | Dành cho khán giả từ 16 tuổi trở lên |
| **T18** | Dành cho khán giả từ 18 tuổi trở lên |
| **C** | Không được phép phổ biến |

---

## 4. Lịch Chiếu

| Mã | Tên Quy Định | Nội Dung |
|:--:|:-------------|:---------|
| **BS19** | Phân bổ lịch chiếu | Mỗi suất chiếu thuộc về một phim, một phòng chiếu và một định dạng phim. |
| **BS20** | Tương thích định dạng | Định dạng phim của suất chiếu phải được phòng chiếu đã chọn hỗ trợ. |
| **BS21** | Khoảng cách dọn phòng | Phải có ít nhất **15 phút** giữa giờ kết thúc của suất chiếu trước và giờ bắt đầu của suất chiếu sau trong cùng một phòng. |
| **BS22** | Không có suất chiếu trong quá khứ | Không thể đặt lịch chiếu trong quá khứ. |
| **BS23** | Không trùng lịch chiếu | Các suất chiếu trong cùng một phòng không được trùng lặp thời gian. |
| **BS24** | Giờ hoạt động | Tất cả suất chiếu phải nằm trong giờ hoạt động của rạp: **6:00 sáng đến 2:00 sáng** hôm sau (giờ Việt Nam). |
| **BS25** | Múi giờ Việt Nam | Tất cả thời gian lịch chiếu theo giờ địa phương Việt Nam (UTC+7). Hệ thống lưu thời gian dưới dạng UTC và chuyển đổi để hiển thị. |

---

## 5. Đặt Vé

| Mã | Tên Quy Định | Nội Dung |
|:--:|:-------------|:---------|
| **BS26** | Số ghế tối thiểu | Khách hàng phải chọn ít nhất **1 ghế** để đặt vé. |
| **BS27** | Số ghế tối đa | Khách hàng không được chọn quá **10 ghế** trong một đơn hàng. |
| **BS28** | Không trùng ghế | Cùng một ghế không được chọn hai lần trong cùng một đơn hàng. |
| **BS29** | Ghế không khả dụng | Ghế đã được thanh toán hoặc đang được giữ tạm thời bởi khách hàng khác không thể được chọn. |
| **BS30** | Tránh ghế đơn lẻ | Khách hàng không được chọn ghế theo cách chỉ để lại **một ghế trống đơn độc** giữa các ghế đã chọn trong một hàng. |
| **BS31** | Giữ ghế tạm thời (WebSocket) | Khi khách hàng chọn ghế và bắt đầu thanh toán, các ghế đó được giữ tạm thời qua WebSocket + HTTP POST lock. Nếu thanh toán không hoàn tất trong **10 phút**, ghế sẽ được giải phóng. |
| **BS32** | Tự động hủy đơn hàng chờ | Đơn hàng còn **Pending** (chưa thanh toán) quá **10 phút** sẽ tự động bị hủy bởi tác vụ Hangfire chạy mỗi 5 phút. Ghế được giải phóng khi hủy. |
| **BS33** | Giải phóng ghế khi mất kết nối | Khi kết nối WebSocket của khách hàng bị mất (đóng trình duyệt, timeout), tất cả ghế do khách đó khóa sẽ tự động được giải phóng. |
| **BS34** | Phương thức thanh toán | Thanh toán trực tuyến được xử lý qua **VNPay**. Bán tại quầy có thể xử lý bằng tiền mặt bởi Thu ngân. |
| **BS35** | Định giá phía máy chủ | Giá vé cuối cùng luôn được tính toán ở phía backend. Hệ thống không tin tưởng giá gửi từ trình duyệt. |
| **BS36** | Ảnh chụp giá | Giá đã áp dụng và khuyến mãi được lưu dưới dạng ảnh chụp trên đơn hàng để tham khảo lịch sử. |
| **BS37** | Xác nhận đặt vé | Đặt vé chỉ có hiệu lực sau khi thanh toán thành công. Khách hàng nhận được mã đặt vé và có thể tải vé PDF. |
| **BS38** | Thay đổi đặt vé | Khách hàng có thể thay đổi hoặc hủy đặt vé trong vòng **2 giờ trước suất chiếu**. Có thể áp dụng phí hủy. |
| **BS39** | Thời gian hoàn tiền | Hoàn tiền được xử lý về phương thức thanh toán ban đầu trong vòng **5–7 ngày làm việc**. |

### Trạng Thái Đơn Hàng

| Trạng thái | Ý nghĩa nghiệp vụ |
|:----------:|:------------------|
| **Pending (Chờ xử lý)** | Ghế đã chọn nhưng chưa hoàn tất thanh toán |
| **Booked (Đã đặt)** | Thanh toán thành công, vé có hiệu lực và đã xác nhận |
| **Canceled (Đã hủy)** | Đơn hàng bị hủy bởi khách hàng hoặc do hết thời gian thanh toán |
| **Refunded (Đã hoàn tiền)** | Đã hoàn tiền (ví dụ sự cố kỹ thuật hoặc rạp hủy suất chiếu) |
| **Completed (Đã hoàn thành)** | Khách hàng đã đến xem phim và vé đã được soát |

---

## 6. Định Giá & Khuyến Mãi

| Mã | Tên Quy Định | Nội Dung |
|:--:|:-------------|:---------|
| **BS40** | Giá cơ bản | Mỗi định dạng phim có giá vé cơ bản. Đây là điểm khởi đầu cho mọi tính toán giá. |
| **BS41** | Giảm giá theo định dạng | Rạp có thể đặt tỷ lệ giảm giá cho các định dạng phim cụ thể. |
| **BS42** | Phụ thu theo định dạng | Rạp có thể đặt tỷ lệ phụ thu cho các định dạng và phân khúc khách hàng cụ thể. |
| **BS43** | Loại khuyến mãi | Khuyến mãi có thể là: **Giá vé cố định**, **Giảm giá phần trăm**, **Giảm giá cố định** hoặc **Phụ thu**. |
| **BS44** | Phạm vi khuyến mãi | Một quy tắc khuyến mãi có thể được giới hạn theo định dạng, rạp, phòng chiếu, phân khúc khách hàng, khoảng ngày, khoảng giờ và ngày trong tuần. |
| **BS45** | Ưu tiên khuyến mãi | Khi nhiều khuyến mãi xung đột, khuyến mãi có **ưu tiên cao nhất** được áp dụng. |
| **BS46** | Giải quyết giá cố định | Nếu nhiều quy tắc giá cố định khớp, chỉ quy tắc có ưu tiên cao nhất được sử dụng. Nếu ưu tiên bằng nhau, giá thấp nhất thắng. |
| **BS47** | Khuyến mãi theo ngày trong tuần | Khuyến mãi có thể cấu hình áp dụng vào ngày cụ thể qua **bitmask 7-bit** (bit 0 = Chủ nhật, bit 1 = Thứ 2, v.v.). |
| **BS48** | Loại trừ ngày lễ | Một chiến dịch khuyến mãi có thể được cấu hình để **không áp dụng vào ngày lễ** qua thực thể lịch ngày lễ. |
| **BS49** | Giá sàn | Giá vé cuối cùng không được dưới 0. |
| **BS50** | Ưu đãi công khai | Các khuyến mãi đang hoạt động được hiển thị công khai trên trang Ưu đãi và được **áp dụng tự động** khi đặt vé. Không cần mã giảm giá. |

### Định Giá Đặc Biệt Cho Khách Hàng

| Mã | Tên Quy Định | Nội Dung |
|:--:|:-------------|:---------|
| **BS51** | Giá sinh viên | Sinh viên có thể nhận được giá vé đặc biệt cố định khi đủ điều kiện. |
| **BS52** | Giảm giá người cao tuổi | Người cao tuổi được giảm ít nhất **20%** giá vé. |
| **BS53** | Giảm giá người khuyết tật | Người khuyết tật nặng được giảm ít nhất **50%**. |
| **BS54** | Hỗ trợ đặc biệt | Người khuyết tật đặc biệt nặng được **miễn phí vé**. |

> Giá đặc biệt áp dụng khi mua trực tiếp tại quầy có xuất trình giấy tờ hợp lệ.

---

## 7. Voucher & Điểm Thưởng

| Mã | Tên Quy Định | Nội Dung |
|:--:|:-------------|:---------|
| **BS55** | Tạo voucher | Admin có thể tạo voucher với tên, mô tả, số tiền/phần trăm giảm giá, chi phí điểm, số lượng và ngày hiệu lực. |
| **BS56** | Kho voucher | Mỗi voucher có tổng số lượng và số lượng còn lại trong kho. |
| **BS57** | Đổi voucher | Khách hàng có thể đổi voucher bằng điểm thưởng của mình. |
| **BS58** | Hết hàng voucher | Không thể đổi voucher nếu số lượng còn lại bằng 0. |
| **BS59** | Hết hạn voucher | Không thể đổi voucher ngoài phạm vi ngày hiệu lực. |
| **BS60** | Không đủ điểm | Khách hàng không thể đổi voucher nếu không có đủ điểm thưởng. |
| **BS61** | Trừ điểm | Điểm thưởng được trừ ngay lập tức khi đổi voucher. |

---

## 8. Nhân Viên & Quản Lý Ca Làm

| Mã | Tên Quy Định | Nội Dung |
|:--:|:-------------|:---------|
| **BS62** | Loại nhân viên | Nhân viên được phân loại là **Toàn thời gian** hoặc **Bán thời gian**. |
| **BS63** | Thời gian ca toàn thời gian | Ca toàn thời gian phải kéo dài đúng **8 giờ**. |
| **BS64** | Thời gian ca bán thời gian | Ca bán thời gian phải kéo dài đúng **4 giờ**. |
| **BS65** | Khung giờ hoạt động | Ca làm chỉ được phân công trong khung **06:00 – 02:00 (hôm sau)** (UTC+7). |
| **BS66** | Điều kiện đăng ký ca bán thời gian | Nhân viên bán thời gian chỉ được đăng ký ca bán thời gian (4h) hoặc ca xoay không dài hơn 4 giờ. |
| **BS67** | Lý do ca ngắn toàn thời gian | Nhân viên toàn thời gian đăng ký ca ngắn hơn 8 giờ phải cung cấp lý do bằng văn bản. |
| **BS68** | Phân công rạp | Nhân viên chỉ có thể đăng ký ca tại rạp được phân công. |
| **BS69** | Ca trong giờ hoạt động | Tất cả ca làm phải nằm trong giờ hoạt động của rạp (6:00 sáng đến 2:00 sáng). |
| **BS70** | Không đăng ký trùng | Nhân viên không thể đăng ký cùng một ca hai lần. |
| **BS71** | Linh hoạt ca xoay | Ca xoay không có thời lượng cố định — có thể dài bất kỳ. |
| **BS72** | Phê duyệt ca | Đăng ký ca bắt đầu ở trạng thái **Chờ xử lý** và cần được quản lý hoặc Admin phê duyệt. |
| **BS73** | Bắt buộc chấm công vào | Nhân viên phải chấm công vào khi bắt đầu ca làm. Chỉ được chấm công vào trong khung giờ ca. |
| **BS74** | Bắt buộc chấm công ra | Nhân viên phải chấm công ra khi kết thúc ca làm. Giờ chấm công ra phải sau giờ chấm công vào. |
| **BS75** | Chấm công nhận diện khuôn mặt | Nhân viên có thể đăng ký khuôn mặt (vector 128-float mã hóa trong DB) để chấm công bằng nhận diện khuôn mặt qua trình duyệt. |
| **BS76** | Tính lương | Lương được tính dựa trên giờ làm việc đã ghi nhận và mức lương theo giờ của nhân viên. |
| **BS77** | Thanh toán lương | Quản lý có thể tính và thanh toán lương. Lương chỉ được thanh toán một lần. |

---

## 9. Bình Luận & Đánh Giá Của Khách Hàng

| Mã | Tên Quy Định | Nội Dung |
|:--:|:-------------|:---------|
| **BS78** | Kiểm duyệt bình luận | Bình luận và đánh giá của khách hàng phải qua quy trình **kiểm duyệt** trước khi được công bố. |
| **BS79** | Quyền sở hữu bình luận | Khách hàng chỉ có thể **chỉnh sửa** hoặc **xóa** bình luận của chính mình. |
| **BS80** | Kiểm tra điều kiện bình luận | Chỉ khách hàng đã xem phim (vé đã thanh toán, suất chiếu đã kết thúc) mới có thể đăng bình luận và đánh giá. Mỗi khách một bài đánh giá cho mỗi phim. |

---

## 10. Chatbot (Trợ Lý Ảo)

| Mã | Tên Quy Định | Nội Dung |
|:--:|:-------------|:---------|
| **BS82** | Chủ đề chatbot | Chatbot có thể xử lý: danh sách phim, suất chiếu, đặt vé, thống kê rạp, nhật ký kiểm toán và FAQ chung. |
| **BS83** | Truy cập chatbot theo vai trò | Khách vãng lai chỉ xem phim. Khách hàng có thể đặt vé. Quản lý xem lịch chiếu. Admin quản lý mọi thứ. Chatbot từ chối yêu cầu không được ủy quyền. |
| **BS84** | Bảo vệ 3 lớp | Chatbot có 3 lớp bảo vệ: (1) **Bộ lọc ngôn ngữ** — lọc từ ngữ không phù hợp, (2) **Phân loại ý định** — định tuyến đến công cụ đúng, (3) **Đăng ký công cụ** — mỗi công cụ kiểm tra quyền vai trò trước khi thực thi. |
| **BS85** | Chuyển tiếp chatbot | Nếu chatbot không hiểu câu hỏi, nó sẽ hướng dẫn người dùng liên hệ hỗ trợ khách hàng. |
| **BS86** | Chatbot không tạo lịch chiếu | LLM không bao giờ trực tiếp tạo lịch chiếu. Quản lý phải xem trước đề xuất AI trước khi áp dụng. |

---

## 11. Quản Trị Hệ Thống

| Mã | Tên Quy Định | Nội Dung |
|:--:|:-------------|:---------|
| **BS87** | Quản lý người dùng | Admin có thể xem, thêm, khóa hoặc kích hoạt tài khoản người dùng. |
| **BS88** | Phân vai trò | Admin có thể gán hoặc xóa vai trò cho bất kỳ người dùng nào (7 vai trò). |
| **BS89** | Chuyển giao quyền | Admin có thể chuyển giao quyền quản lý từ người này sang người khác (ví dụ chuyển Quản lý Rạp từ nhân viên A sang nhân viên B). |
| **BS90** | Giám sát tác vụ nền | Admin có thể xem và giám sát việc thực thi tác vụ nền và trạng thái của chúng (Hangfire dashboard). |
| **BS91** | Nhật ký kiểm toán | Tất cả hành động quan trọng đều được ghi lại. Admin có thể xem và tìm kiếm nhật ký kiểm toán. |
| **BS92** | Phê duyệt xóa ca | Khi quản lý xóa ca có nhân viên đã đăng ký, yêu cầu phê duyệt sẽ được gửi đến Admin. |

---

## 12. Vận Hành Hệ Thống

| Mã | Tên Quy Định | Nội Dung |
|:--:|:-------------|:---------|
| **BS93** | Múi giờ Việt Nam | Tất cả thời gian hiển thị cho nhân viên và khách hàng sử dụng **giờ địa phương Việt Nam (UTC+7)**. Backend lưu UTC, frontend tự động chuyển đổi. |
| **BS94** | Hỗ trợ ba ngôn ngữ | Hệ thống hỗ trợ **Tiếng Anh** (mặc định), **Tiếng Việt** (UTF-8 có dấu) và **Tiếng Nga** (bảng chữ cái Kirin). |
| **BS95** | Bảo vệ dữ liệu | Thông tin nhận dạng nhạy cảm của khách hàng phải được bảo vệ trước khi lưu trữ. |
| **BS96** | Quyền dữ liệu người dùng | Người dùng có quyền truy cập, chỉnh sửa và yêu cầu xóa dữ liệu cá nhân của mình. |
| **BS97** | Dữ liệu tươi mới | Dữ liệu hiển thị cho khách hàng (phim, suất chiếu, v.v.) phải được cập nhật sau các thay đổi nghiệp vụ quan trọng. Dịch vụ nền đồng bộ trạng thái mỗi 10 phút. |

---

## 13. Pháp Lý & Tuân Thủ

| Mã | Tên Quy Định | Nội Dung |
|:--:|:-------------|:---------|
| **BS98** | Ưu tiên phim Việt Nam | Suất chiếu phim Việt Nam được ưu tiên từ **18:00 đến 22:00**. |
| **BS99** | Giờ chiếu dưới 13 tuổi | Suất chiếu cho khách hàng dưới 13 tuổi phải kết thúc **trước 22:00**. |
| **BS100** | Giờ chiếu dưới 16 tuổi | Suất chiếu cho khách hàng dưới 16 tuổi phải kết thúc **trước 23:00**. |
| **BS101** | Không quay phim | Khách hàng không được quay phim trái phép trong rạp. |
| **BS102** | Không gây rối | Khách hàng không được gây mất trật tự hoặc cản trở khách hàng khác. |
| **BS103** | Không hút thuốc | Thuốc lá và thuốc lá điện tử không được phép trong rạp. |
| **BS104** | Không vũ khí | Vũ khí, vật liệu dễ cháy và chất độc hại bị cấm. |
| **BS105** | Không thú cưng | Thú cưng không được phép vào rạp (trừ động vật hỗ trợ). |
| **BS106** | Không đồ ăn ngoài | Đồ ăn và thức uống từ bên ngoài không được phép mang vào khi chưa được cho phép. |
| **BS107** | Cam kết bảo mật | Dữ liệu cá nhân của khách hàng không được bán hoặc chuyển giao cho bên thứ ba mà không có sự đồng ý. |
| **BS108** | Sử dụng cookie | Trang web sử dụng cookie để cải thiện trải nghiệm người dùng. Khách hàng có thể quản lý cài đặt cookie trong trình duyệt. |

---

## 14. Quy Tắc Sơ Đồ Ghế

| Mã | Tên Quy Định | Nội Dung |
|:--:|:-------------|:---------|
| **BS109** | Phòng chiếu phải có ghế | Một phòng chiếu phải có ít nhất một ghế. |
| **BS110** | Hàng liên tục | Các hàng ghế phải được điền liên tục. Một hàng không thể bỏ qua vị trí 1 đến vị trí 3 trong khi vị trí 2 bị thiếu. |
| **BS111** | Cột liên tục | Các cột ghế phải được điền liên tục không có khoảng trống ở giữa. |
| **BS112** | Không trùng vị trí | Hai ghế không thể có cùng vị trí lưới. |
| **BS113** | Không trùng nhãn | Hai ghế không thể có cùng nhãn ghế trong cùng một phòng chiếu. |

---

## 15. Nghiệp Vụ Thu Ngân

| Mã | Tên Quy Định | Nội Dung |
|:--:|:-------------|:---------|
| **BS114** | Bán tại quầy | Thu ngân có thể bán vé tại quầy bằng cách chọn phim, suất chiếu và ghế thay mặt khách hàng. |
| **BS115** | Tra cứu khách hàng | Thu ngân có thể tra cứu khách hàng qua email để bán tại quầy. |
| **BS116** | Truy cập POS khoa/phòng | Thu ngân đăng nhập bằng tài khoản dùng chung của khoa/phòng để truy cập hệ thống POS. |

---

## 16. Công việc nền & Tự động hóa

| Mã | Tên Quy Định | Nội Dung |
|:--:|:-------------|:---------|
| **BS117** | Tự động hủy đơn hàng chờ | Một công việc định kỳ Hangfire chạy mỗi 5 phút để tự động hủy các đơn hàng còn **Pending** sau 10 phút, giải phóng ghế đã khóa. |
| **BS118** | Đồng bộ trạng thái phim/lịch chiếu tự động | Một dịch vụ nền chạy mỗi 10 phút để cập nhật trạng thái hoạt động của phim và lịch chiếu. |
| **BS119** | Đồng bộ lượt xem phim dạng đệm | Lượt xem phim của khách hàng được lưu tạm và đồng bộ theo lô để giảm ghi database. |
| **BS120** | Đồng bộ AI embedding khi khởi động | Khi dịch vụ AI khởi động, nó đồng bộ dữ liệu phim để tạo và lưu vector embeddings trong Qdrant cho tìm kiếm ngữ nghĩa. |

---

## 17. Đề xuất lịch chiếu bằng AI

| Mã | Tên Quy Định | Nội Dung |
|:--:|:-------------|:---------|
| **BS121** | AI chỉ đề xuất, không tạo trực tiếp | AI tạo ra các đề xuất nhưng không trực tiếp tạo lịch chiếu. Quản lý phải xem trước và áp dụng. |
| **BS122** | Xem trước trước khi áp dụng | Quản lý phải xem trước các đề xuất trước khi áp dụng vào lịch chiếu. |
| **BS123** | Kiểm tra lại khi áp dụng | Khi áp dụng, hệ thống luôn kiểm tra lại: quyền chiếu phim, hỗ trợ định dạng, khoảng thời gian hiệu lực, kiểm tra thời gian quá khứ, xung đột phòng chiếu và khoảng dọn phòng (15 phút). |
