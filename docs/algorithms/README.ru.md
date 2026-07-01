# Обзор алгоритмов

Языки: [English](README.en.md) | [Tiếng Việt](README.vi.md) | [Русский](README.ru.md)

Эта папка содержит описания продуктовых и технических алгоритмов, используемых в Galaxiad Cinema.

## Документы

| Документ | English | Vietnamese | Russian |
| --- | --- | --- | --- |
| Алгоритм поиска фильмов | [movie-search.md](en/movie-search.md) | [movie-search.md](vi/movie-search.md) | [movie-search.md](ru/movie-search.md) |
| Алгоритм рекомендации фильмов | [movie-recommendation.md](en/movie-recommendation.md) | [movie-recommendation.md](vi/movie-recommendation.md) | [movie-recommendation.md](ru/movie-recommendation.md) |
| Динамическое ценообразование | [pricing-promotions.md](en/pricing-promotions.md) | [pricing-promotions.md](vi/pricing-promotions.md) | [pricing-promotions.md](ru/pricing-promotions.md) |
| Чат-бот с ролевым доступом | [role-aware-chatbot.md](en/role-aware-chatbot.md) | [role-aware-chatbot.md](vi/role-aware-chatbot.md) | [role-aware-chatbot.md](ru/role-aware-chatbot.md) |
| Стратегия кэширования Redis | [redis-cache-strategy.md](en/redis-cache-strategy.md) | [redis-cache-strategy.md](vi/redis-cache-strategy.md) | [redis-cache-strategy.md](ru/redis-cache-strategy.md) |
| Правила составления смен | [shift-schedule-rules.md](en/shift-schedule-rules.md) | [shift-schedule-rules.md](vi/shift-schedule-rules.md) | [shift-schedule-rules.md](ru/shift-schedule-rules.md) |
| **Блокировка мест Real-time (SignalR)** 🔥 | **[seat-locking.md](en/seat-locking.md)** | **[seat-locking.md](vi/seat-locking.md)** | **[seat-locking.md](ru/seat-locking.md)** |

## AI Showtime Planner

AI Showtime Planner помогает менеджерам и администраторам получать рекомендации по расписанию показов. В версии V1 система не обучает собственную модель. Бэкенд оценивает реальные бизнес-данные с помощью детерминированных правил, сохраняет историю рекомендаций и действий, а LLM используется только для объяснений на естественном языке через чат-бота.

Основные входные данные:

1. Тренды оплаченных билетов, заполняемость и выручка.
2. Сигналы просмотров/поисков фильмов (если доступны).
3. Оценки и комментарии.
4. Свежесть фильма и период активного показа.
5. Вместимость зала, поддерживаемые форматы и существующие конфликты расписания.
6. Прайм-тайм окна (вечера будних дней и более сильные слоты выходных).

Основные гарантии:

1. LLM никогда не создает расписание напрямую.
2. Менеджеры должны просматривать рекомендации перед применением.
3. Применение всегда перепроверяет авторизацию фильма, поддержку формата, период активности, время в прошлом, конфликты залов и интервал уборки.
4. Примененные, отклоненные, не прошедшие проверку и просмотренные действия сохраняются для аудита и будущих улучшений.

## Основной принцип

Сначала используйте самый дешевый и надежный путь получения данных:

1. Используйте детерминированный SQL для структурированных бизнес-вопросов.
2. Используйте SQL с ограниченным LLM-резюме для аналитических вопросов по комментариям или метрикам.
3. Используйте семантический поиск/RAG только когда намерение пользователя зависит от смысла, сходства, текста политики или нечеткого естественного языка.

LLM должен классифицировать намерение и писать финальное объяснение. Бэкенд должен владеть авторизацией, выполнением SQL, вызовами векторного поиска, обрезкой данных и финальной фильтрацией области.
