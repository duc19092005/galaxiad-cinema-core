# AI Chatbot

> Intelligent virtual assistant integrated with Claude Opus. Global component on all pages.

## Overview

Global floating chatbot supporting:
1. **Intent Classification** — Movie lookup, schedules, booking help, stats, FAQ
2. **SSE Streaming** — Real-time response via Server-Sent Events
3. **Chat History** — Persistent conversation history
4. **3-Layer Protection** — Linguistic Guard → Intent Classification → Tool Registry
5. **Role-Based Access** — Permissions per user role

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
| `ChatUseCase` | Process chat, classify intent, call LLM |
| `StreamChatUseCase` | Streaming response via SSE |

### Architecture
```
User Input → Linguistic Guard (filter bad language) →
Intent Classifier →
  - "get_movies" → SQL movie query
  - "get_schedules" → SQL schedule query
  - "booking_help" → Booking guidance
  - "cinema_stats" → SQL stats query
  - "audit_log" → Admin-only SQL query
  - "faq" → FAQ lookup
  - "general" → Claude Opus directly
→ Tool Registry (check role permissions) →
  - Guest: browse movies only
  - Customer: movies + booking
  - Manager: schedules + stats
  - Admin: full access
→ LLM Response (Claude Opus) → Format → SSE stream → Frontend
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
> LLM (Claude Opus) **never directly creates showtime schedules**. Backend owns: authorization, SQL execution, vector search, data trimming, scope filtering. LLM only: classify intent, write explanation.
