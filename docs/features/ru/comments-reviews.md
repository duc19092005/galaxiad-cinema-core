# Комментарии и отзывы — Comments & Reviews

> Комментарии и рейтинги фильмов с системой ответов, AI-модерацией и трендами.

## Обзор

Позволяет клиентам:
1. Писать комментарии и оценки для фильмов
2. Отвечать на комментарии
3. Просматривать трендовые и самые рейтинговые фильмы
4. **AI-модерация**: Автоматическая проверка перед публикацией

## Frontend

Комментарии встроены в страницу деталей фильма:
| Маршрут | Компонент | Описание |
|---|---|---|
| `/movie/:movieId` | `MovieDetailPage` → `CommentsSection` | Комментарии в деталях фильма |

### Ключевые компоненты
- **`CommentsFeed`**: Список комментариев
- **`CommentCard`**: Карточка комментария (аватар, имя, рейтинг, текст, время)
- **`CommentForm`**: Форма комментария (текст + звёзды)
- **`ReplyList`**: Список ответов
- **`ReplyForm`**: Форма ответа
- **`RatingStars`**: Звёздный рейтинг
- **`TrendingMoviesSection`**: Трендовые фильмы
- **`TopRatedMoviesSection`**: Самые рейтинговые фильмы

## Backend

### API Endpoints
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `api/v1/comments/movies/{movieId}` | Комментарии фильма |
| POST | `api/v1/comments/movies/{movieId}` | Добавить комментарий |
| GET | `api/v1/comments/movies/trending` | Трендовые фильмы |
| GET | `api/v1/comments/movies/top-rated` | Самые рейтинговые |
| GET | `api/v1/comments/{parentCommentId}/replies` | Ответы на комментарий |
| POST | `api/v1/comments/{parentCommentId}/replies` | Добавить ответ |
| PUT | `api/v1/comments/{commentId}` | Обновить комментарий |
| DELETE | `api/v1/comments/{commentId}` | Удалить комментарий |

### Use Cases
| Use Case | Описание |
|---|---|
| `GetMovieCommentsUseCase` | Комментарии фильма |
| `AddCommentUseCase` | Добавить (с AI-модерацией) |
| `UpdateCommentUseCase` | Обновить |
| `DeleteCommentUseCase` | Удалить |
| `GetRepliesUseCase` | Ответы |
| `AddReplyUseCase` | Добавить ответ |
| `GetTrendingMoviesUseCase` | Тренды |
| `GetTopRatedMoviesUseCase` | Самые рейтинговые |

### Domain Entities
| Сущность | Описание |
|---|---|
| `Comment` | Комментарий (MovieId, UserId, Content, Rating, Status) |
| `CommentReply` | Ответ (CommentId, UserId, Content, CreatedAt) |

### Enums
| Enum | Значения |
|---|---|
| `CommentStatus` | Pending, Approved, Rejected, Deleted |

## Описание потока данных

### Написание комментария (с AI-модерацией)
```
Пользователь → /movie/:movieId → Пишет комментарий → POST →
Backend → AI проверка:
  - Контент подходит?
  - Спам/токсичность?
→ OK → Status = Approved → Публикация
→ Нарушение → Status = Rejected → Уведомление пользователю
→ Нужна проверка → Status = Pending → Ожидание модератора
```

### Условия
> [!NOTE]
> Только пользователи, посмотревшие фильм (оплаченный билет, сеанс завершён), могут комментировать. Один отзыв на фильм на пользователя.
