# 📚 Feature Inventory — Galaxiad Cinema

> Detailed documentation of all system features. [Tiếng Việt](README.vi.md) | [Русский](README.ru.md)

---

## Feature List

### 👤 Customer
| Feature | File | Description |
|---|---|---|
| [Authentication](./en/authentication.md) | `authentication.md` | Registration, login, Google OAuth, JWT, profile management |
| [Individual Booking](./en/booking.md) | `booking.md` | Real-time seat selection (WebSocket), VNPay payment, PDF ticket download |
| [Movie Catalog](./en/movie-catalog.md) | `movie-catalog.md` | Now showing, coming soon, movie detail, similar movies (vector search) |
| [Comments & Reviews](./en/comments-reviews.md) | `comments-reviews.md` | Write reviews, reply system, AI moderation, trending movies |
| [Group Booking (Social)](./en/social-booking.md) | `social-booking.md` | Create groups, vote movies, pair system, group chat, group payment |

### 🤖 AI
| Feature | File | Description |
|---|---|---|
| [AI Chatbot](./en/ai-chatbot.md) | `ai-chatbot.md` | Movie assistant, schedule lookup, booking support (SSE streaming) |
| [AI Recommendations](./en/ai-recommendations.md) | `ai-recommendations.md` | Preference survey, personalized movie suggestions (vector embedding) |

### 💰 Business Operations
| Feature | File | Description |
|---|---|---|
| [Cashier POS](./en/cashier-pos.md) | `cashier-pos.md` | Counter ticket sales, face recognition, QR scanning |
| [Staff Portal](./en/staff-portal.md) | `staff-portal.md` | Shift registration, clock in/out, working history, payroll |

### 🏢 Administration
| Feature | File | Description |
|---|---|---|
| [Admin Panel](./en/admin.md) | `admin.md` | Users, RBAC, dashboard, audit, vouchers, pricing, promotions |
| [Facilities Management](./en/facilities.md) | `facilities.md` | Cinema, auditorium, seat layout, department management |
| [Movie Management](./en/movie-manager.md) | `movie-manager.md` | Movie CRUD, formats, genres, age ratings |
| [Theater Management](./en/theater-manager.md) | `theater-manager.md` | Schedule CRUD, AI showtime recommendations, shifts, payroll |

---

## Statistics

| Category | Count |
|---|---|
| Total Features | 13 |
| Frontend Routes | 30+ |
| API Controllers | 29 |
| Use Cases | 181 |
| i18n Languages | 3 (EN/VI/RU) |

---

## Related

- [Algorithms](../algorithms/README.en.md) — Algorithm documentation
- [Business Rules](../business/README.en.md) — Business rules reference
- [API Guide](../../apps/backend/docs/dev/) — API integration guide
