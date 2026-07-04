# Chatbot AI

> Trợ lý ảo thông minh tích hợp LangChain Agent, hỗ trợ tư vấn phim, tra cứu thông tin và đặt vé tự động.

## Tổng quan

Chatbot AI là component global xuất hiện trên tất cả các trang:
1. **Phân loại ý định (Intent Classification)** — Xác định mục đích câu hỏi
2. **SSE Streaming** — Trả lời real-time qua Server-Sent Events
3. **Chat History** — Lưu lịch sử hội thoại (Redis 30 phút)
4. **3-Layer Protection** — Bảo vệ an toàn: Linguistic Guard → Intent Classification → LangChain Agent + Tool Registry
5. **Role-Based Access** — Phân quyền theo vai trò người dùng
6. **Auto Booking Flow** — Agent tự động đặt vé qua 3 tools
7. **LangChain Agent** — `create_tool_calling_agent` với DeepSeek LLM
8. **Redis Memory** — Lưu lịch sử chat 30 phút, fallback In-Memory
9. **3 Tools** — suggest_seats, get_available_vouchers, confirm_booking

### Chatbot Topics (BS82)
- Danh sách phim, lịch chiếu, đặt vé, đặt vé tự động, gợi ý ghế, áp dụng voucher
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
| `ChatUseCase` | Xử lý chat, phân loại intent, gọi LangChain Agent |
| `StreamChatUseCase` | Streaming response qua SSE |

### Architecture

```
User Input → C# Backend →
  Linguistic Guard (lọc ngôn ngữ xấu) →
  Intent Classifier (phân loại ý định) →
  C# Tool Registry (truy vấn DB lấy context) →
  gRPC (protobuf) →
  Python AI Service →
    LangChain Agent (DeepSeek LLM + 3 Tools):
      - suggest_seats_tool: Gợi ý ghế thông minh
      - get_available_vouchers_tool: Tra voucher
      - confirm_booking_tool: Tạo đơn hàng
  → Response → Frontend UI (Chat + Action Cards)
```

### Backend Layers

| Layer | Công nghệ | Vai trò |
|-------|-----------|---------|
| C# (.NET 8) | ASP.NET Core | Guard, Intent Classification, DB Tools, Authorization |
| gRPC | protobuf | Giao tiếp C# ↔ Python |
| Python AI | FastAPI + LangChain | Agent điều khiển, LLM call, Tool execution |
| LLM | DeepSeek | Xử lý ngôn ngữ tự nhiên |
| Vector DB | Qdrant | Semantic search embeddings |
| Cache | Redis | Chat history 30 phút |

### Python AI Service Structure

```
services/ai/
├── app/
│   ├── agent.py       — LangChain Agent (create_tool_calling_agent)
│   ├── tools.py       — 3 LangChain Tools (seats, vouchers, booking)
│   ├── main.py        — FastAPI (REST + gRPC endpoints)
│   ├── embedder.py    — Google Gemini Embedding + Qdrant
│   ├── grpc_server.py — gRPC server for C# communication
│   ├── config.py      — Configuration
│   └── models.py      — Pydantic models
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
> - LangChain Agent sử dụng DeepSeek LLM với `create_tool_calling_agent` từ `langchain-classic`
> - Agent có quyền truy cập 3 tools: gợi ý ghế, tra voucher, xác nhận đặt vé
> - Nếu Agent thất bại, hệ thống tự động fallback về gọi DeepSeek trực tiếp
> - Lịch sử chat lưu trên Redis với TTL 30 phút
> - LLM **không bao giờ trực tiếp tạo lịch chiếu** — backend kiểm soát: authorization, SQL execution, vector search, data trimming, scope filtering
