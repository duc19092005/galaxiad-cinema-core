# AI Чат-бот

> Интеллектуальный виртуальный помощник на базе LangChain Agent, интегрированный с DeepSeek LLM для запросов о фильмах и автоматического бронирования.

## Обзор

Плавающий чат-бот, поддерживающий:
1. **Классификацию намерений** — Поиск фильмов, расписание, бронирование, авто-бронирование, статистика, FAQ
2. **SSE стриминг** — Ответы в реальном времени через Server-Sent Events
3. **Историю чата** — Сохранение истории диалогов (Redis 30 мин)
4. **3-уровневую защиту** — Linguistic Guard → Intent Classification → LangChain Agent + Tool Registry
5. **Ролевой доступ** — Разрешения в зависимости от роли
6. **Авто-бронирование** — Управление бронированием через 3 инструмента Agent
7. **LangChain Agent** — `create_tool_calling_agent` с DeepSeek LLM
8. **Redis Memory** — 30-минутная история, In-Memory резерв
9. **3 Инструмента** — suggest_seats, get_available_vouchers, confirm_booking

### Темы чат-бота (BS82)
- Списки фильмов, сеансы, бронирования, авто-бронирование, подбор мест, применение ваучеров
- Статистика кинотеатра, журналы аудита
- Общие FAQ

## Frontend

### Routes
| Маршрут | Компонент | Описание |
|---|---|---|
| Глобальный | `ChatBot` | Плавающая кнопка + модал на всех страницах |

### Custom Hooks
- **`useChatbotSSE`**: SSE хук для стриминга ответов

## Backend

### API Endpoints
| Метод | Endpoint | Описание |
|---|---|---|
| POST | `api/v1/chatbot/chat` | Отправить сообщение (без стриминга) |
| POST | `api/v1/chatbot/chat/stream` | Отправить сообщение (SSE стриминг) |

### Use Cases
| Use Case | Описание |
|---|---|
| `ChatUseCase` | Обработка чата, классификация, LangChain Agent |
| `StreamChatUseCase` | Стриминг через SSE |

### Архитектура
```
Ввод пользователя → C# Backend →
  Linguistic Guard (фильтрация) →
  Intent Classifier →
  C# Tool Registry (запрос DB для контекста) →
  gRPC (protobuf) →
  Python AI Service →
    LangChain Agent (DeepSeek LLM + 3 инструмента):
      - suggest_seats_tool: Умный подбор мест
      - get_available_vouchers_tool: Поиск ваучеров
      - confirm_booking_tool: Создание заказа
  → Ответ → Frontend UI (Чат + Action Cards)
```

### Слои бэкенда

| Слой | Технология | Роль |
|------|-----------|------|
| C# (.NET 8) | ASP.NET Core | Guard, Intent Classification, DB Tools, Authorization |
| gRPC | protobuf | Связь C# ↔ Python |
| Python AI | FastAPI + LangChain | Оркестрация Agent, LLM, выполнение инструментов |
| LLM | DeepSeek | Обработка естественного языка |
| Vector DB | Qdrant | Эмбеддинги семантического поиска |
| Cache | Redis | История чата 30 мин |

### Структура Python AI сервиса
```
services/ai/
├── app/
│   ├── agent.py       — LangChain Agent (create_tool_calling_agent)
│   ├── tools.py       — 3 инструмента LangChain (места, ваучеры, бронирование)
│   ├── main.py        — FastAPI (REST + gRPC endpoints)
│   ├── embedder.py    — Google Gemini Embedding + Qdrant
│   ├── grpc_server.py — gRPC сервер
│   ├── config.py      — Конфигурация
│   └── models.py      — Pydantic модели
```

### Enums
| Enum | Значения |
|---|---|
| `IntentType` | GetMovies, GetSchedules, BookingHelp, CinemaStats, AuditLog, FAQ, General |
| `MessageRole` | User, Assistant, System |

> [!IMPORTANT]
> Использует **SSE** (Server-Sent Events) для стриминга — **НЕ WebSocket**.

> [!NOTE]
> - LangChain Agent использует DeepSeek LLM с `create_tool_calling_agent` из `langchain-classic`
> - Agent имеет доступ к 3 инструментам: подбор мест, поиск ваучеров, подтверждение бронирования
> - При сбое Agent автоматически переключается на прямой вызов DeepSeek
> - История чата хранится в Redis с TTL 30 минут
> - LLM **никогда не создаёт расписание напрямую** — backend управляет: авторизацией, SQL, векторным поиском, фильтрацией
