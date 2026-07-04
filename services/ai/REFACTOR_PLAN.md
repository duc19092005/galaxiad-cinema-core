# Plan: Clean up Python AI Service (`services/ai/`)

## Vấn đề

| Issue | File | Chi tiết |
|-------|------|----------|
| `main.py` quá lớn (646 dòng) | `main.py` | Router handlers, prompt strings, HTTP helpers, lifespan — tất cả trong 1 file |
| Prompt bị hardcode | `main.py` | `/guard`, `/classify-intent`, `/moderate` có system prompt dài hardcode |
| `call_deepseek()` lặp code | `main.py` + `agent.py` | Cả 2 file đều có httpx client gọi DeepSeek |

## Mục tiêu

Tách `main.py` → `routes/` + `prompts.py` + `llm_client.py`

```
services/ai/app/
├── main.py              # ~30 dòng: lifespan, CORS, include routers
├── config.py             # Config (giữ nguyên)
├── models.py             # Pydantic models (giữ nguyên)
├── prompts.py           # ALL system prompts (guard, classify, moderate, agent)
├── llm_client.py        # call_deepseek() + call_deepseek_stream()
├── routes/
│   ├── health.py         # GET /health
│   ├── embedding.py      # POST /embed-movies, DELETE, POST /sync-movies
│   ├── recommendations.py # POST /recommend, POST /recommend-by-id
│   ├── guard.py           # POST /guard
│   ├── classification.py  # POST /classify-intent
│   ├── moderation.py      # POST /moderate
│   └── chat.py            # POST /chat, POST /chat/stream
├── agent.py               # LangChain Agent (chỉ 3 tools nặng)
├── tools.py               # 3 tools: suggest_seats, vouchers, confirm_booking
├── embedder.py            # Qdrant (giữ nguyên)
└── grpc_server.py         # gRPC server (giữ nguyên)
```

## Files giữ nguyên

- `config.py`, `models.py`, `tools.py` (3 tools), `embedder.py`, `grpc_server.py`
- `tests/`, `pb/`, `protos/`

## Kiến trúc thật

```
┌─── User ─────────────────────────────────────────────┐
│  React Frontend (chat message)                        │
└─────────────────────────┬────────────────────────────┘
                          │ HTTP
                          ▼
┌─── C# (.NET) ────────────────────────────────────────┐
│  ChatbotOrchestrator                                  │
│    0. Guard ──gRPC──► Python /guard                   │
│    1. Classify ──gRPC──► Python /classify-intent       │
│    2. Tool Registry (C#, gọi SQL trực tiếp):          │
│       - GetMovies, GetShowtimes, GetMyBookings...     │
│       → toolContext (JSON)                            │
│    3. Chat ──gRPC──► Python /chat                      │
│       gửi message + toolContext                        │
└─────────────────────────┬────────────────────────────┘
                          │ gRPC
                          ▼
┌─── Python (FastAPI) ─────────────────────────────────┐
│  /chat endpoint                                        │
│    LangChain Agent (3 tools nặng):                     │
│      - suggest_seats_tool ──HTTP──► C# API             │
│      - get_available_vouchers_tool ──HTTP──► C# API    │
│      - confirm_booking_tool ──HTTP──► C# API           │
└──────────────────────────────────────────────────────┘
```
