# AI Рекомендации фильмов

> Персонализированные рекомендации фильмов с использованием векторных эмбеддингов и Qdrant.

## Обзор

Предоставляет:
1. **Опрос предпочтений** — Анкета о предпочтениях в фильмах
2. **Персонализированные рекомендации** — Индивидуальные предложения фильмов
3. **Синхронизация эмбеддингов** — Синхронизация эмбеддингов фильмов в Qdrant
4. **Похожие фильмы** — Также использует векторный поиск (см. [Каталог](./movie-catalog.md))

## Frontend

### Routes
| Маршрут | Компонент | Описание |
|---|---|---|
| `/` | `HomePage` → `SurveyModal` | Опрос на главной странице |

### Ключевые компоненты
- **`SurveyModal`**: Модал опроса предпочтений
- **`GenreSelector`**: Выбор любимых жанров
- **`RatingSelector`**: Минимальный рейтинг
- **`YearRangeSelector`**: Диапазон годов
- **`RecommendedMovieList`**: Список рекомендованных фильмов
- **`RecommendedMovieCard`**: Карточка с причиной рекомендации

## Backend

### API Endpoints
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `api/v1/Recommendation/survey/status` | Проверить статус опроса |
| POST | `api/v1/Recommendation/survey` | Отправить опрос |
| GET | `api/v1/Recommendation/movies` | Получить рекомендации |
| POST | `api/v1/Recommendation/sync-movies` | Синхронизировать эмбеддинги |

### Use Cases
| Use Case | Описание |
|---|---|
| `GetSurveyStatusUseCase` | Статус опроса |
| `SubmitSurveyUseCase` | Сохранить опрос |
| `GetRecommendedMoviesUseCase` | Рекомендации из Qdrant |
| `SyncMoviesToVectorDbUseCase` | Синхронизация в Qdrant |

### Domain Entities
| Сущность | Описание |
|---|---|
| `UserPreference` | Предпочтения (GenreIds, MinRating, YearFrom, YearTo) |
| `MovieEmbedding` | Векторный эмбеддинг фильма (MovieId, Vector, UpdatedAt) |

## Описание потока данных

### Опрос и рекомендации
```
Пользователь → Главная → SurveyModal → Выбор жанров →
Выбор рейтинга → Выбор годов → POST survey →
Backend сохраняет предпочтения → [Синхронизация в Qdrant если нужно] →
GET recommended movies → Векторный поиск в Qdrant →
Cosine similarity → Top-N фильмов → Показ RecommendedMovieList
```

> [!NOTE]
> - **Векторная БД**: Qdrant
> - **Метод поиска**: Cosine similarity
> - **Синхронизация**: Авто при запуске или вручную через API
