# 📚 Danh Sách Tính Năng — Galaxiad Cinema

> Tài liệu chi tiết các tính năng trong hệ thống. [English](README.en.md) | [Русский](README.ru.md)

---

## Danh Mục Tính Năng

### 👤 Khách Hàng
| Tính Năng | File | Mô Tả |
|---|---|---|
| [Đăng ký/Đăng nhập](./vi/authentication.md) | `authentication.md` | Đăng ký, đăng nhập, Google OAuth, JWT, quản lý hồ sơ |
| [Đặt vé cá nhân](./vi/booking.md) | `booking.md` | Chọn ghế real-time (WebSocket), thanh toán VNPay, tải vé PDF |
| [Danh sách phim](./vi/movie-catalog.md) | `movie-catalog.md` | Phim đang chiếu, sắp chiếu, chi tiết, phim tương tự (vector search) |
| [Bình luận & Đánh giá](./vi/comments-reviews.md) | `comments-reviews.md` | Viết review, reply, AI moderation, trending |
| [Đặt vé nhóm](./vi/social-booking.md) | `social-booking.md` | Tạo nhóm, vote phim, ghép đôi, chat, thanh toán nhóm |

### 🤖 AI
| Tính Năng | File | Mô Tả |
|---|---|---|
| [Chatbot AI](./vi/ai-chatbot.md) | `ai-chatbot.md` | Tư vấn phim, tra cứu lịch chiếu, hỗ trợ đặt vé (SSE streaming) |
| [Gợi ý phim AI](./vi/ai-recommendations.md) | `ai-recommendations.md` | Khảo sát sở thích, gợi ý cá nhân hóa (vector embedding) |

### 💰 Quản Lý Kinh Doanh
| Tính Năng | File | Mô Tả |
|---|---|---|
| [Bán vé tại quầy](./vi/cashier-pos.md) | `cashier-pos.md` | POS bán vé, nhận diện khuôn mặt, QR code |
| [Portal nhân viên](./vi/staff-portal.md) | `staff-portal.md` | Đăng ký ca, chấm công, lịch sử, lương |

### 🏢 Quản Trị
| Tính Năng | File | Mô Tả |
|---|---|---|
| [Quản trị hệ thống](./vi/admin.md) | `admin.md` | Users, RBAC, dashboard, audit, voucher, giá vé, khuyến mãi |
| [Quản lý cơ sở](./vi/facilities.md) | `facilities.md` | Rạp, phòng chiếu, sơ đồ ghế, phòng ban |
| [Quản lý phim](./vi/movie-manager.md) | `movie-manager.md` | CRUD phim, định dạng, thể loại |
| [Quản lý lịch chiếu](./vi/theater-manager.md) | `theater-manager.md` | Lịch chiếu, AI gợi ý, ca làm, lương |

---

## Thống Kê

| Hạng Mục | Số Lượng |
|---|---|
| Tổng tính năng | 13 |
| Frontend routes | 30+ |
| API Controllers | 29 |
| Use Cases | 181 |
| i18n languages | 3 (EN/VI/RU) |

---

## Liên Quan

- [Thuật toán](../algorithms/README.vi.md) — Chi tiết thuật toán
- [Quy tắc kinh doanh](../business/README.vi.md) — Quy tắc nghiệp vụ
- [API Guide](../../apps/backend/docs/dev/) — Hướng dẫn tích hợp API
