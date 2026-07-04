# AI Чат-бот

> Интеллектуальный виртуальный помощник на базе LangChain Agent, интегрированный с DeepSeek LLM для запросов о фильмах и автоматического бронирования.

## Обзор

Плавающий чат-бот, поддерживающий:

1. **Лингвистический фильтр** — Фильтрация prompt injection, jailbreak, токсичного языка (Python)
2. **Классификация намерений** — Определение намерения пользователя (Python LLM)
3. **C# Tool Registry** — «Лёгкие» инструменты в C#, напрямую запрашивающие БД
4. **LangChain Agent** — «Тяжёлые» инструменты (бронирование) через Python Agent
5. **SSE стриминг** — Ответы в реальном времени
6. **Redis память** — 30-минутная история чата

### Архитектура

```
┌─── Пользователь ────────────────────────────────────────────┐
│  React Frontend (сообщение чата)                              │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP
                           ▼
┌─── C# (.NET) ───────────────────────────────────────────────┐
│  ChatbotOrchestrator                                         │
│    0. Guard ──gRPC──► Python /guard                          │
│    1. Classify ──gRPC──► Python /classify-intent              │
│    2. C# Tool Registry (прямые запросы к SQL Server):         │
│       ├── GetMovies, GetShowtimes                             │
│       ├── GetMyBookings, GetPromotions                        │
│       ├── SearchMoviesSemantic ──HTTP──► Python/recommend     │
│       └── GetCinemaLocations, GetCinemaStatistics...          │
│       → Результат: toolContext (JSON строка)                  │
│    3. Chat ──gRPC──► Python /chat                              │
│       отправляет: message + toolContext                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ gRPC
                           ▼
┌─── Python (FastAPI) ────────────────────────────────────────┐
│  LangChain Agent (create_tool_calling_agent)                 │
│  Обрабатывает только 3 «тяжёлых» инструмента:                │
│    ├── suggest_seats_tool        ──HTTP──► C# API            │
│    ├── get_available_vouchers_tool ──HTTP──► C# API           │
│    └── confirm_booking_tool      ──HTTP──► C# API             │
│  + toolContext из C# для ответов на другие запросы            │
└─────────────────────────────────────────────────────────────┘
```

**Что такое toolContext?** — C# самостоятельно запрашивает БД для получения фильмов, сеансов, статистики и т.д., упаковывает в JSON и отправляет вместе с сообщением пользователя Agent. Agent читает контекст и отвечает без дополнительных API-вызовов.

## Backend

### API Endpoints
| Метод | Endpoint | Описание |
|---|---|---|
| POST | `api/v1/chatbot/chat` | Отправить сообщение (без стриминга) |
| POST | `api/v1/chatbot/chat/stream` | Отправить сообщение (SSE стриминг) |

### C# Tool Registry («Лёгкие» инструменты)
| Intent | Инструмент | Источник данных |
|--------|-----------|----------------|
| GetMovies | SQL запрос фильмов | SQL Server |
| GetShowtimes | SQL запрос сеансов | SQL Server |
| GetMyBookings | SQL запрос броней | SQL Server |
| SearchMoviesSemantic | Python `/recommend` | Qdrant |
| GetPromotions, GetCinemaLocations... | SQL запросы | SQL Server |

### LangChain Agent («Тяжёлые» инструменты)
| Инструмент | Описание | Связь |
|-----------|---------|-------|
| `suggest_seats_tool` | Умный подбор мест, приоритет последовательных | HTTP → C# API |
| `get_available_vouchers_tool` | Поиск ваучеров | HTTP → C# API |
| `confirm_booking_tool` | Создание заказа, paymentUrl | HTTP → C# API |

> [!IMPORTANT]
> Использует **SSE** для стриминга — **НЕ WebSocket**.

> [!NOTE]
> - LangChain Agent использует DeepSeek LLM с `create_tool_calling_agent`
> - Agent имеет только 3 тяжёлых инструмента (бронирование). Лёгкие (фильмы, сеансы...) работают в C#
> - `toolContext` — JSON из C# Tool Registry, отправляемый Agent для ответов
