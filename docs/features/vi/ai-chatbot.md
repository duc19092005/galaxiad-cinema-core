# Chatbot AI

> Trợ lý ảo thông minh tích hợp LangChain Agent, hỗ trợ tư vấn phim, tra cứu thông tin và đặt vé tự động.

## Tổng quan

Chatbot AI là component global xuất hiện trên tất cả các trang:

1. **Linguistic Guard** — Lọc prompt injection, jailbreak, ngôn ngữ xấu (Python)
2. **Intent Classification** — Phân loại ý định câu hỏi (Python LLM)
3. **C# Tool Registry** — Tools "nhẹ" chạy trong C# gọi DB trực tiếp
4. **LangChain Agent** — Tools "nặng" (đặt vé) chạy qua Agent Python
5. **SSE Streaming** — Trả lời real-time
6. **Redis Memory** — Lưu lịch sử chat 30 phút

### Kiến trúc chi tiết

```
┌─── User ────────────────────────────────────────────────┐
│  React Frontend (chat message)                           │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP
                           ▼
┌─── C# (.NET) ──────────────────────────────────────────┐
│  ChatbotOrchestrator                                    │
│    0. Guard ──gRPC──► Python /guard (lọc ngôn ngữ)      │
│    1. Classify ──gRPC──► Python /classify-intent         │
│    2. C# Tool Registry (gọi SQL Server trực tiếp)        │
│       ├── GetMovies, GetShowtimes                        │
│       ├── GetMyBookings, GetPromotions                   │
│       ├── SearchMoviesSemantic ──HTTP──► Python/recommend│
│       └── GetCinemaLocations, GetCinemaStatistics...     │
│       → Kết quả: toolContext (JSON string)               │
│    3. Chat ──gRPC──► Python /chat                         │
│       gửi: message + toolContext                          │
└──────────────────────────┬──────────────────────────────┘
                           │ gRPC
                           ▼
┌─── Python (FastAPI) ───────────────────────────────────┐
│  LangChain Agent (create_tool_calling_agent)            │
│  Chỉ xử lý 3 tools "nặng" — cần LLM suy luận:           │
│    ├── suggest_seats_tool        ──HTTP──► C# API       │
│    ├── get_available_vouchers_tool ──HTTP──► C# API      │
│    └── confirm_booking_tool      ──HTTP──► C# API        │
│  + toolContext từ C# để trả lời các câu hỏi khác         │
└─────────────────────────────────────────────────────────┘
```

**ToolContext là gì?** — C# tự query DB lấy dữ liệu phim, lịch chiếu, thống kê... đóng gói thành JSON string gửi kèm sang Agent. Agent chỉ việc đọc context và trả lời, không cần gọi thêm API cho các thông tin này.

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
| `ChatbotOrchestrator` | Điều phối toàn bộ: Guard → Classify → Tool Registry → LangChain Agent |

### C# Tool Registry (tools "nhẹ")
| Intent | Tool | Nguồn dữ liệu |
|--------|------|--------------|
| GetMovies | Query SQL danh sách phim | SQL Server |
| GetShowtimes | Query SQL lịch chiếu | SQL Server |
| GetMyBookings | Query SQL vé đã mua | SQL Server |
| GetPromotions | Query SQL khuyến mãi | SQL Server |
| GetCinemaStatistics | Query SQL thống kê | SQL Server |
| GetSystemAuditLogs | Query SQL audit log | SQL Server |
| GetBookingStatus | Query SQL trạng thái đơn | SQL Server |
| GetCinemaLocations | Query SQL danh sách rạp | SQL Server |
| GetAvailableSeats | Query SQL ghế trống | SQL Server |
| SearchMoviesSemantic | Gọi Python `/recommend` | Qdrant |
| GetTrendingMovies | Query SQL phim thịnh hành | SQL Server |

> Các tools này chạy trực tiếp trong C#, gọi EF Core → SQL Server. Kết quả là JSON `toolContext` gửi kèm cho Agent.

### LangChain Agent (tools "nặng")
| Tool | Mô tả | Giao tiếp |
|------|-------|-----------|
| `suggest_seats_tool` | Gợi ý ghế thông minh gần trung tâm, ưu tiên liên tiếp | HTTP → C# API |
| `get_available_vouchers_tool` | Tra voucher cho user đã login | HTTP → C# API |
| `confirm_booking_tool` | Tạo đơn hàng, trả về paymentUrl | HTTP → C# API |

> 3 tools này chạy trong LangChain Agent (Python), gọi lại C# Backend qua HTTP.

### Backend Layers
| Layer | Công nghệ | Vai trò |
|-------|-----------|---------|
| C# (.NET 8) | ASP.NET Core | Guard client, Intent client, Tool Registry (DB), Authorization |
| gRPC | protobuf | Giao tiếp C# → Python (guard + classify + chat) |
| Python AI | FastAPI + LangChain | Guard server, Intent server, Agent orchestration |
| LLM | DeepSeek | Xử lý ngôn ngữ tự nhiên |
| Vector DB | Qdrant | Semantic search embeddings |
| Cache | Redis | Chat history 30 phút |

### Python AI Service Structure
```
services/ai/
├── app/
│   ├── main.py        — FastAPI app + routers
│   ├── config.py      — Configuration
│   ├── models.py      — Pydantic models
│   ├── agent.py       — LangChain Agent (3 tools nặng)
│   ├── tools.py       — suggest_seats, vouchers, confirm_booking
│   ├── embedder.py    — Qdrant + embedding
│   └── grpc_server.py — gRPC server
```

### Domain Entities
| Entity | Mô tả |
|---|---|
| `ChatMessage` | Tin nhắn chat (UserId, Role, Content, Timestamp) |
| `ChatSession` | Phiên chat (UserId, StartedAt, LastActivityAt) |

### Enums
| Enum | Values |
|---|---|
| `IntentType` | GetMovies, GetShowtimes, GetMyBookings, GetPromotions, GetCinemaStatistics, GetSystemAuditLogs, GetBookingStatus, GetCinemaLocations, GetAvailableSeats, SearchMoviesSemantic, GetTrendingMovies, GeneralFAQ |
| `MessageRole` | User, Assistant, System |

## Ghi chú

> [!IMPORTANT]
> Chatbot sử dụng **SSE** (Server-Sent Events) cho streaming response, **không phải WebSocket**.

> [!NOTE]
> - LangChain Agent sử dụng DeepSeek LLM với `create_tool_calling_agent` từ `langchain-classic`
> - Agent chỉ có 3 tools nặng (đặt vé). Tools nhẹ (danh sách phim, lịch chiếu...) chạy trong C#
> - `toolContext` là JSON do C# Tool Registry tạo ra, gửi kèm cho Agent để trả lời
> - Nếu Agent thất bại, hệ thống tự động fallback về gọi DeepSeek trực tiếp
> - Lịch sử chat lưu trên Redis với TTL 30 phút
