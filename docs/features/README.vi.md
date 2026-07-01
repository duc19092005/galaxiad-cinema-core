# 📚 Danh Sách Tính Năng — Galaxiad Cinema

> Tài liệu chi tiết các tính năng trong hệ thống. [English](README.en.md) | [Русский](README.ru.md)

---

## Danh Mục Tính Năng

### 👤 Khách Hàng
| Tính Năng | File | Mô Tả |
|---|---|---|
| [Đăng ký/Đăng nhập](./vi/authentication.md) | `authentication.md` | 8 endpoints (Đăng ký, Đăng nhập, Google OAuth, Profile) |
| [Đặt vé cá nhân](./vi/booking.md) | `booking.md` | 11 endpoints (Chọn ghế real-time, VNPay, PDF) |
| [Danh sách phim](./vi/movie-catalog.md) | `movie-catalog.md` | 17 endpoints (Đang chiếu, Sắp chiếu, Chi tiết, Search) |
| [Bình luận & Đánh giá](./vi/comments-reviews.md) | `comments-reviews.md` | 8 endpoints (Viết review, Reply, Moderation, Trending) |
| [Đặt vé nhóm](./vi/social-booking.md) | `social-booking.md` | 20 endpoints (Nhóm, Ghép đôi, Voting, Chat, Payment) |

### 🤖 AI
| Tính Năng | File | Mô Tả |
|---|---|---|
| [Chatbot AI](./vi/ai-chatbot.md) | `ai-chatbot.md` | 2 endpoints (Chat, Stream) |
| [Gợi ý phim AI](./vi/ai-recommendations.md) | `ai-recommendations.md` | 4 endpoints (Khảo sát, Gợi ý) |

### 💰 Quản Lý Kinh Doanh
| Tính Năng | File | Mô Tả |
|---|---|---|
| [Bán vé tại quầy](./vi/cashier-pos.md) | `cashier-pos.md` | TBD (POS — dùng chung Booking + Department) |
| [Portal nhân viên](./vi/staff-portal.md) | `staff-portal.md` | 11 endpoints (Ca làm, Chấm công, Lương) |

### 🏢 Quản Trị
| Tính Năng | File | Mô Tả |
|---|---|---|
| [Quản trị hệ thống](./vi/admin.md) | `admin.md` | 30+ endpoints (Users, Roles, Vouchers, Pricing, Audit, Jobs) |
| [Quản lý cơ sở](./vi/facilities.md) | `facilities.md` | 13 endpoints (Rạp, Phòng, Ghế) |
| [Quản lý phim](./vi/movie-manager.md) | `movie-manager.md` | 5 endpoints (CRUD, Định dạng, Thể loại) |
| [Quản lý lịch chiếu](./vi/theater-manager.md) | `theater-manager.md` | 27 endpoints (Lịch chiếu, AI Gợi ý, Ca làm, Dashboard) |

---

## Thống Kê

| Hạng Mục | Số Lượng |
|---|---|
| Tổng tính năng | 13 |
| API Controllers | 29 |
| API Endpoints | ~164 |
| Use Cases | 167 |
| i18n languages | 3 (EN/VI/RU) |

---

## Liên Quan

- [Thuật toán](../algorithms/README.vi.md) — Chi tiết thuật toán
- [Quy tắc kinh doanh](../business/README.vi.md) — Quy tắc nghiệp vụ
