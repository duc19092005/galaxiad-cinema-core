# AI Chatbot

> Intelligent virtual assistant powered by LangChain Agent, integrated with DeepSeek LLM for movie queries and auto-booking.

## Overview

Global floating chatbot supporting:

1. **Linguistic Guard** — Filters prompt injection, jailbreak, toxic language (Python)
2. **Intent Classification** — Classifies user intent (Python LLM)
3. **C# Tool Registry** — "Light" tools running in C# that query DB directly
4. **LangChain Agent** — "Heavy" tools (booking flow) via Python Agent
5. **SSE Streaming** — Real-time response
6. **Redis Memory** — 30-min chat history

### Architecture

```
┌─── User ────────────────────────────────────────────────────┐
│  React Frontend (chat message)                               │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP
                           ▼
┌─── C# (.NET) ──────────────────────────────────────────────┐
│  ChatbotOrchestrator                                        │
│    0. Guard ──gRPC──► Python /guard                         │
│    1. Classify ──gRPC──► Python /classify-intent             │
│    2. C# Tool Registry (queries SQL Server directly):        │
│       ├── GetMovies, GetShowtimes                            │
│       ├── GetMyBookings, GetPromotions                       │
│       ├── SearchMoviesSemantic ──HTTP──► Python/recommend    │
│       └── GetCinemaLocations, GetCinemaStatistics...         │
│       → Output: toolContext (JSON string)                    │
│    3. Chat ──gRPC──► Python /chat                             │
│       sends: message + toolContext                            │
└──────────────────────────┬──────────────────────────────────┘
                           │ gRPC
                           ▼
┌─── Python (FastAPI) ───────────────────────────────────────┐
│  LangChain Agent (create_tool_calling_agent)                │
│  Only handles 3 "heavy" tools (need LLM reasoning):         │
│    ├── suggest_seats_tool        ──HTTP──► C# API           │
│    ├── get_available_vouchers_tool ──HTTP──► C# API          │
│    └── confirm_booking_tool      ──HTTP──► C# API            │
│  + toolContext from C# for answering other queries           │
└─────────────────────────────────────────────────────────────┘
```

**What is toolContext?** — C# queries the DB for movies, showtimes, statistics, etc., packages them as JSON, and sends them alongside the user message to the Agent. The Agent reads the context and responds, without needing extra API calls for this data.

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
| `ChatbotOrchestrator` | Orchestrates: Guard → Classify → Tool Registry → LangChain Agent |

### C# Tool Registry ("Light" Tools)
| Intent | Tool | Data Source |
|--------|------|-------------|
| GetMovies | SQL query movies | SQL Server |
| GetShowtimes | SQL query schedules | SQL Server |
| GetMyBookings | SQL query bookings | SQL Server |
| GetPromotions | SQL query promotions | SQL Server |
| GetCinemaStatistics | SQL query stats | SQL Server |
| GetSystemAuditLogs | SQL query audit log | SQL Server |
| GetBookingStatus | SQL query order status | SQL Server |
| GetCinemaLocations | SQL query cinemas | SQL Server |
| GetAvailableSeats | SQL query available seats | SQL Server |
| SearchMoviesSemantic | Call Python `/recommend` | Qdrant |
| GetTrendingMovies | SQL query trending movies | SQL Server |

> These tools run in C#, calling EF Core → SQL Server. Result is a JSON `toolContext` sent to the Agent.

### LangChain Agent ("Heavy" Tools)
| Tool | Description | Communication |
|------|-------------|---------------|
| `suggest_seats_tool` | Smart seat suggestion near center, prefer consecutive | HTTP → C# API |
| `get_available_vouchers_tool` | Voucher lookup for logged-in users | HTTP → C# API |
| `confirm_booking_tool` | Create order, return paymentUrl | HTTP → C# API |

> These 3 tools run inside LangChain Agent (Python), calling back to C# Backend via HTTP.

### Backend Layers
| Layer | Technology | Role |
|-------|-----------|------|
| C# (.NET 8) | ASP.NET Core | Guard client, Intent client, Tool Registry (DB), Authorization |
| gRPC | protobuf | C# → Python communication (guard + classify + chat) |
| Python AI | FastAPI + LangChain | Guard server, Intent server, Agent orchestration |
| LLM | DeepSeek | Natural language processing |
| Vector DB | Qdrant | Semantic search embeddings |
| Cache | Redis | Chat history 30 min TTL |

### Python AI Service Structure
```
services/ai/
├── app/
│   ├── main.py        — FastAPI app + routers
│   ├── config.py      — Configuration
│   ├── models.py      — Pydantic models
│   ├── agent.py       — LangChain Agent (3 heavy tools)
│   ├── tools.py       — suggest_seats, vouchers, confirm_booking
│   ├── embedder.py    — Qdrant + embedding
│   └── grpc_server.py — gRPC server
```

> [!IMPORTANT]
> Uses **SSE** (Server-Sent Events) for streaming — **NOT WebSocket**.

> [!NOTE]
> - LangChain Agent uses DeepSeek LLM with `create_tool_calling_agent` from `langchain-classic`
> - Agent only has 3 heavy tools (booking). Light tools (movies, showtimes...) run in C#
> - `toolContext` is JSON from C# Tool Registry, sent alongside the message to the Agent
> - Falls back to direct DeepSeek call if Agent fails
> - Chat history stored in Redis with 30-minute TTL
