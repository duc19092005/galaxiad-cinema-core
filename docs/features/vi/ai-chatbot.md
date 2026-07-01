# Chatbot AI

> Trợ lý ảo thông minh tích hợp DeepSeek Chat, hỗ trợ tư vấn phim và tra cứu thông tin.

## Tổng quan

Chatbot AI là component global xuất hiện trên tất cả các trang:
1. **Phân loại ý định (Intent Classification)** — Xác định mục đích câu hỏi
2. **SSE Streaming** — Trả lời real-time qua Server-Sent Events
3. **Chat History** — Lưu lịch sử hội thoại
4. **3-Layer Protection** — Bảo vệ an toàn: Linguistic Guard → Intent Classification → Tool Registry
5. **Role-Based Access** — Phân quyền theo vai trò người dùng

### Chatbot Topics (BS81)
- Danh sách phim, lịch chiếu, đặt vé
- Thống kê rạp, audit log
- FAQ tổng quát

## Frontend

### Routes
| Route | Component | Mô tả |
|---|---|---|
| Global | `ChatBot` | Floating chatbot button + modal trên mọi trang |

### Components chính
- **`ChatBotFAB`**: Floating action button mở chatbot
- **`ChatBotModal`**: Modal chat
- **`ChatMessage`**: Message bubble
- **`ChatInput`**: Input gửi tin nhắn
- **`ChatHistoryList`**: Danh sách lịch sử chat

### Custom Hooks
- **`useChatbotSSE`**: SSE hook cho streaming response

## Backend

### API Endpoints
| Method | Endpoint | Chức năng |
|---|---|---|
| POST | `api/v1/chatbot/chat` | Gửi câu hỏi, nhận trả lời (non-streaming) |
| POST | `api/v1/chatbot/chat/stream` | Gửi câu hỏi, nhận streaming response (SSE) |

> **Legacy route prefix**: `api/chat` cũng tồn tại song song với `api/v1/chatbot`

### Use Cases
| Use Case | Mô tả |
|---|---|
| `ChatUseCase` | Xử lý chat, phân loại intent, gọi LLM |
| `StreamChatUseCase` | Streaming response qua SSE |

### Architecture

```
User Input → Linguistic Guard (lọc ngôn ngữ xấu) →
Intent Classifier (phân loại mục đích) →
  - "get_movies" → SQL query movies
  - "get_schedules" → SQL query schedules
  - "booking_help" → Hướng dẫn đặt vé
  - "cinema_stats" → SQL query thống kê
  - "audit_log" → Admin only SQL query
  - "faq" → FAQ lookup
  - "general" → DeepSeek Chat trực tiếp
→ Tool Registry (kiểm tra quyền role) →
  - Guest: chỉ browse movies
  - Customer: browse movies + booking
  - Manager: schedule + stats
  - Admin: full access
→ LLM Response (DeepSeek Chat) → Format → SSE stream → Frontend
```

### Domain Entities
| Entity | Mô tả |
|---|---|
| `ChatMessage` | Tin nhắn chat (UserId, Role, Content, Timestamp) |
| `ChatSession` | Phiên chat (UserId, StartedAt, LastActivityAt) |

### Enums
| Enum | Values |
|---|---|
| `IntentType` | GetMovies, GetSchedules, BookingHelp, CinemaStats, AuditLog, FAQ, General |
| `MessageRole` | User, Assistant, System |

## Ghi chú

> [!IMPORTANT]
> Chatbot sử dụng **SSE** (Server-Sent Events) cho streaming response, **không phải WebSocket**.

> [!NOTE]
> - LLM (DeepSeek Chat) **không bao giờ trực tiếp tạo lịch chiếu**
> - Backend sở hữu: authorization, SQL execution, vector search, data trimming, scope filtering
> - LLM chỉ: classify intent, viết explanation
