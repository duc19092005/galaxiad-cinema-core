# AI Chatbot

> Intelligent virtual assistant powered by LangChain Agent, integrated with DeepSeek LLM for movie queries and auto-booking.

## Overview

Global floating chatbot supporting:
1. **Intent Classification** — Movie lookup, schedules, booking help, auto-booking, stats, FAQ
2. **SSE Streaming** — Real-time response via Server-Sent Events
3. **Chat History** — Persistent conversation history (Redis 30 min TTL)
4. **3-Layer Protection** — Linguistic Guard → Intent Classification → LangChain Agent + Tool Registry
5. **Role-Based Access** — Permissions per user role
6. **Auto Booking Flow** — Agent-driven booking via 3 LangChain tools
7. **LangChain Agent** — `create_tool_calling_agent` with DeepSeek LLM
8. **Redis Memory** — 30-minute chat history, In-Memory fallback
9. **3 Tools** — suggest_seats, get_available_vouchers, confirm_booking

### Chatbot Topics (BS82)
- Movie lists, showtimes, bookings, auto-booking, seat suggestions, voucher application
- Cinema statistics, audit logs
- General FAQ

## Frontend

### Routes
| Route | Component | Description |
|---|---|---|
| Global | `ChatBot` | Floating button + modal on all pages |

### Custom Hooks
- **`useChatbotSSE`**: SSE hook for streaming responses

## Backend

### API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | `api/v1/chatbot/chat` | Send message, get response (non-streaming) |
| POST | `api/v1/chatbot/chat/stream` | Send message, SSE streaming response |

> **Legacy route**: `api/chat` also exists alongside `api/v1/chatbot`

### Use Cases
| Use Case | Description |
|---|---|
| `ChatUseCase` | Process chat, classify intent, call LangChain Agent |
| `StreamChatUseCase` | Streaming response via SSE |

### Architecture
```
User Input → C# Backend →
  Linguistic Guard (filter bad language) →
  Intent Classifier →
  C# Tool Registry (query DB for context) →
  gRPC (protobuf) →
  Python AI Service →
    LangChain Agent (DeepSeek LLM + 3 Tools):
      - suggest_seats_tool: Smart seat suggestion
      - get_available_vouchers_tool: Voucher lookup
      - confirm_booking_tool: Order creation
  → Response → Frontend UI (Chat + Action Cards)
```

### Backend Layers

| Layer | Technology | Role |
|-------|-----------|------|
| C# (.NET 8) | ASP.NET Core | Guard, Intent Classification, DB Tools, Authorization |
| gRPC | protobuf | C# ↔ Python communication |
| Python AI | FastAPI + LangChain | Agent orchestration, LLM calls, Tool execution |
| LLM | DeepSeek | Natural language processing |
| Vector DB | Qdrant | Semantic search embeddings |
| Cache | Redis | Chat history 30 min TTL |

### Python AI Service Structure
```
services/ai/
├── app/
│   ├── agent.py       — LangChain Agent (create_tool_calling_agent)
│   ├── tools.py       — 3 LangChain Tools (seats, vouchers, booking)
│   ├── main.py        — FastAPI (REST + gRPC endpoints)
│   ├── embedder.py    — Google Gemini Embedding + Qdrant
│   ├── grpc_server.py — gRPC server
│   ├── config.py      — Configuration
│   └── models.py      — Pydantic models
```

### Domain Entities
| Entity | Description |
|---|---|
| `ChatMessage` | Message (UserId, Role, Content, Timestamp) |
| `ChatSession` | Chat session (UserId, StartedAt, LastActivityAt) |

### Enums
| Enum | Values |
|---|---|
| `IntentType` | GetMovies, GetSchedules, BookingHelp, CinemaStats, AuditLog, FAQ, General |
| `MessageRole` | User, Assistant, System |

> [!IMPORTANT]
> Uses **SSE** (Server-Sent Events) for streaming — **NOT WebSocket**.

> [!NOTE]
> - LangChain Agent uses DeepSeek LLM with `create_tool_calling_agent` from `langchain-classic`
> - Agent has access to 3 tools: seat suggestion, voucher lookup, booking confirmation
> - Falls back to direct DeepSeek call if Agent fails
> - Chat history stored in Redis with 30-minute TTL
> - LLM **never directly creates showtime schedules** — backend owns: authorization, SQL execution, vector search, data trimming, scope filtering
