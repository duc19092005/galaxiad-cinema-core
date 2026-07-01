# AI Чат-бот

> Интеллектуальный виртуальный помощник на базе DeepSeek Chat. Глобальный компонент на всех страницах.

## Обзор

Плавающий чат-бот, поддерживающий:
1. **Классификацию намерений** — Поиск фильмов, расписание, бронирование, статистика, FAQ
2. **SSE стриминг** — Ответы в реальном времени через Server-Sent Events
3. **Историю чата** — Сохранение истории диалогов
4. **3-уровневую защиту** — Linguistic Guard → Intent Classification → Tool Registry
5. **Ролевой доступ** — Разрешения в зависимости от роли

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
| `ChatUseCase` | Обработка чата, классификация, LLM |
| `StreamChatUseCase` | Стриминг через SSE |

### Архитектура
```
Ввод пользователя → Linguistic Guard (фильтрация) →
Intent Classifier →
  - "get_movies" → SQL запрос фильмов
  - "get_schedules" → SQL запрос расписания
  - "booking_help" → Помощь с бронированием
  - "cinema_stats" → SQL запрос статистики
  - "audit_log" → SQL запрос (только Admin)
  - "faq" → FAQ
  - "general" → DeepSeek Chat напрямую
→ Tool Registry (проверка прав роли) →
  - Guest: только фильмы
  - Customer: фильмы + бронирование
  - Manager: расписание + статистика
  - Admin: полный доступ
→ LLM Response (DeepSeek Chat) → Форматирование → SSE стрим → Frontend
```

### Enums
| Enum | Значения |
|---|---|
| `IntentType` | GetMovies, GetSchedules, BookingHelp, CinemaStats, AuditLog, FAQ, General |
| `MessageRole` | User, Assistant, System |

> [!IMPORTANT]
> Использует **SSE** (Server-Sent Events) для стриминга — **НЕ WebSocket**.

> [!NOTE]
> LLM (DeepSeek Chat) **никогда не создаёт расписание напрямую**. Backend владеет: авторизацией, SQL, векторным поиском, обрезкой данных, фильтрацией. LLM только: классифицирует намерение, пишет объяснение.
