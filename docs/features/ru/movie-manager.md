# Управление фильмами — Movie Management

> Управление информацией о фильмах: CRUD, форматы, жанры, возрастные рейтинги.

## Обзор

Позволяет Movie Manager:
1. CRUD фильмов
2. Управление форматами (2D, 3D, IMAX, 4DX)
3. Управление жанрами и возрастными рейтингами
4. Управление статусом фильма (Now Showing / Coming Soon)

> [!WARNING]
> **DELETE endpoint сломан**: Frontend вызывает `DELETE /api/movieManager/movies/{id}`, но бэкенд не имеет endpoint. `DeleteMovieUseCase` есть в DI, но не подключён к контроллеру.

## Frontend

### Routes
| Маршрут | Компонент | Описание |
|---|---|---|
| `/movie-manager` | `MovieManagerPage` | Дашборд управления фильмами |

### Ключевые компоненты
- **`MovieTable`**: Таблица фильмов
- **`MovieFormModal`**: Модал добавления/редактирования
- **`MovieFormatTag`**: Тег формата
- **`GenreMultiSelect`**: Множественный выбор жанров
- **`AgeRatingSelect`**: Выбор возрастного рейтинга
- **`MovieStatusToggle`**: Переключатель статуса

## Backend

### API Endpoints
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `api/movieManager/movies` | Список фильмов |
| GET | `api/movieManager/movies/{id}` | Детали фильма |
| POST | `api/movieManager/movies` | Создать фильм |
| PUT | `api/movieManager/movies/{id}` | Обновить фильм |
| GET | `api/movieManager/movie-formats` | Список форматов |
| POST | `api/movieManager/movie-formats` | Создать формат |
| GET | `api/movieManager/genres` | Список жанров |
| POST | `api/movieManager/genres` | Создать жанр |
| GET | `api/movieManager/age-ratings` | Возрастные рейтинги |

### Use Cases
| Use Case | Описание |
|---|---|
| `CreateMovieUseCase` | Создать фильм |
| `UpdateMovieUseCase` | Обновить фильм |
| `DeleteMovieUseCase` | **Нет endpoint — сломан** |
| `GetMoviesUseCase` | Список фильмов |
| `GetMovieDetailUseCase` | Детали фильма |
| `CreateMovieFormatUseCase` | Создать формат |
| `CreateGenreUseCase` | Создать жанр |

### Domain Entities
| Сущность | Описание |
|---|---|
| `MovieInfo` | Фильм (Title, Description, PosterUrl, Duration, ReleaseDate) |
| `MovieFormat` | Формат (2D, 3D, IMAX, 4DX) |
| `Genre` | Жанр |
| `AgeRating` | Возрастной рейтинг (P, K, T13, T16, T18, C) |

## Описание потока данных

### Добавление фильма
```
Movie Manager → /movie-manager → "Add Movie" → MovieFormModal →
Ввод информации → Выбор жанров → Выбор форматов → POST →
Backend проверяет → Сохраняет MovieInfo + MovieGenre → Обновление таблицы
```

### Удаление фильма (сломано)
```
Movie Manager → Удаление → DELETE api/movieManager/movies/{id} →
❌ 404 Not Found (endpoint не реализован)
```
