# Обзор алгоритмов

Языки: [English](README.md) | [Tiếng Việt](README.vi.md) | [Русский](README.ru.md)

В этой папке описаны продуктовые и технические алгоритмы, используемые в Galaxiad Cinema.

## Документы

| Документ | English | Vietnamese | Русский |
| --- | --- | --- | --- |
| Алгоритм поиска фильмов | [movie-search.md](movie-search.md) | [movie-search.vi.md](movie-search.vi.md) | [movie-search.ru.md](movie-search.ru.md) |
| Алгоритм рекомендаций фильмов | [movie-recommendation.md](movie-recommendation.md) | [movie-recommendation.vi.md](movie-recommendation.vi.md) | [movie-recommendation.ru.md](movie-recommendation.ru.md) |
| Динамические ценовые акции | [pricing-promotions.md](pricing-promotions.md) | [pricing-promotions.vi.md](pricing-promotions.vi.md) | [pricing-promotions.ru.md](pricing-promotions.ru.md) |
| План ролевого чатбота | [role-aware-chatbot.md](role-aware-chatbot.md) | [role-aware-chatbot.vi.md](role-aware-chatbot.vi.md) | [role-aware-chatbot.ru.md](role-aware-chatbot.ru.md) |
| Стратегия Redis Cache | [redis-cache-strategy.md](redis-cache-strategy.md) | [redis-cache-strategy.vi.md](redis-cache-strategy.vi.md) | [redis-cache-strategy.ru.md](redis-cache-strategy.ru.md) |
| Правила планирования смен | [shift-schedule-rules.md](shift-schedule-rules.md) | [shift-schedule-rules.vi.md](shift-schedule-rules.vi.md) | [shift-schedule-rules.ru.md](shift-schedule-rules.ru.md) |

## AI Showtime Planner

AI Showtime Planner помогает менеджерам кинотеатра и администраторам получать рекомендации по расписанию сеансов. В версии V1 система не обучает отдельную модель. Backend оценивает реальные бизнес-данные по детерминированным правилам, сохраняет историю рекомендаций и действий менеджера, а LLM используется только для объяснения рекомендаций естественным языком через chatbot.

Основные входные данные:

1. Тренд оплаченных билетов, заполняемость зала и выручка.
2. Сигналы просмотров или поиска фильмов, если они доступны.
3. Оценки и комментарии зрителей.
4. Новизна релиза и активный период показа фильма.
5. Вместимость зала, поддерживаемые форматы и существующие конфликты расписания.
6. Прайм-тайм окна, включая вечер будних дней и более сильные слоты выходных.

Основные бизнес-гарантии:

1. LLM никогда не создает расписание напрямую.
2. Менеджер должен предварительно просмотреть рекомендации перед применением.
3. При применении backend всегда повторно проверяет разрешение фильма, поддержку формата, активный период фильма, прошлое время, конфликты зала и буфер уборки.
4. Действия просмотра, применения, отклонения и ошибки проверки сохраняются для аудита и дальнейшего улучшения.

## Основной принцип

Сначала используется самый дешевый и надежный путь получения ответа:

1. Детерминированный SQL для структурированных бизнес-вопросов.
2. SQL плюс ограниченное резюме LLM для аналитических вопросов по комментариям или метрикам.
3. Semantic search или RAG только тогда, когда намерение пользователя зависит от смысла, сходства, текста политики или нечеткого естественного языка.

LLM должен классифицировать намерение и формировать финальное объяснение. Backend должен отвечать за авторизацию, выполнение SQL, вызовы vector search, сокращение данных и финальную фильтрацию области доступа.
