# 📚 Feature Inventory — Galaxiad Cinema

> Detailed documentation of all system features. [Tiếng Việt](README.vi.md) | [Русский](README.ru.md)

---

## Feature List

### 👤 Customer
| Feature | File | Description |
|---|---|---|
| [Authentication](./en/authentication.md) | `authentication.md` | 8 endpoints (Registration, Login, Google OAuth, Profile) |
| [Individual Booking](./en/booking.md) | `booking.md` | 11 endpoints (Seat selection, VNPay, PDF) |
| [Movie Catalog](./en/movie-catalog.md) | `movie-catalog.md` | 17 endpoints (Now showing, Coming soon, Details, Search) |
| [Comments & Reviews](./en/comments-reviews.md) | `comments-reviews.md` | 8 endpoints (Write reviews, Reply, Moderation, Trending) |
| [Group Booking (Social)](./en/social-booking.md) | `social-booking.md` | 20 endpoints (Groups, Pairs, Voting, Chat, Payment) |

### 🤖 AI
| Feature | File | Description |
|---|---|---|
| [AI Chatbot](./en/ai-chatbot.md) | `ai-chatbot.md` | 2 endpoints (Chat, Stream) |
| [AI Recommendations](./en/ai-recommendations.md) | `ai-recommendations.md` | 4 endpoints (Survey, Suggestions) |

### 💰 Business Operations
| Feature | File | Description |
|---|---|---|
| [Cashier POS](./en/cashier-pos.md) | `cashier-pos.md` | TBD (Counter sales — shared with Booking + Department) |
| [Staff Portal](./en/staff-portal.md) | `staff-portal.md` | 11 endpoints (Shifts, Clock in/out, Payroll) |

### 🏢 Administration
| Feature | File | Description |
|---|---|---|
| [Admin Panel](./en/admin.md) | `admin.md` | 30+ endpoints (Users, Roles, Vouchers, Pricing, Promotions, Audit, Dashboard, Jobs) |
| [Facilities Management](./en/facilities.md) | `facilities.md` | 13 endpoints (Cinemas, Auditoriums, Departments) |
| [Movie Management](./en/movie-manager.md) | `movie-manager.md` | 5 endpoints (CRUD, Formats, Age ratings) |
| [Theater Management](./en/theater-manager.md) | `theater-manager.md` | 27 endpoints (Schedules, AI Recommendations, Shifts, Dashboard) |

---

## Statistics

| Category | Count |
|---|---|
| Total Features | 13 |
| API Controllers | 29 |
| API Endpoints | ~164 |
| Use Cases (Backend) | 167 |
| Frontend Route Modules | 12 |
| i18n Languages | 3 (EN/VI/RU) |

---

## Related

- [Algorithms](../algorithms/README.en.md) — Algorithm documentation
- [Business Rules](../business/README.en.md) — Business rules reference
<!-- API endpoints are listed in each feature file below -->
