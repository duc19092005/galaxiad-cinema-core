# Каталог фильмов — Movie Catalog

> Просмотр фильмов с расширенным поиском, векторным поиском похожих фильмов и GPS.

## Обзор

Позволяет клиентам:
1. Просматривать текущие и предстоящие фильмы
2. Детальная информация о фильме
3. Похожие фильмы через vector similarity search
4. Расширенный поиск с фильтрами
5. Ближайшие кинотеатры по GPS

## Frontend

### Routes
| Маршрут | Компонент | Описание |
|---|---|---|
| `/movies` | `MovieListPage` | Список фильмов |
| `/movie/:movieId` | `MovieDetailPage` | Детали фильма + сеансы |
| `/movie/:movieId/similar` | `SimilarMoviesSection` | Похожие фильмы |

### Ключевые компоненты
- **`MovieCard`**: Карточка фильма (постер, название, рейтинг, жанр)
- **`MovieGrid`**: Сетка фильмов
- **`MovieFilterBar`**: Панель фильтров (жанр, формат, язык, дата)
- **`MovieSearchInput`**: Поиск с автодополнением
- **`MovieDetailHero`**: Hero секция (большой постер, информация)
- **`ShowtimeList`**: Список сеансов по кинотеатрам и датам
- **`GPSNearestCinemas`**: Ближайшие кинотеатры по GPS

## Backend

### API Endpoints
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `api/v1/public/movies/now-showing` | Текущие фильмы |
| GET | `api/v1/public/movies/coming-soon` | Предстоящие фильмы |
| GET | `api/v1/public/movies/cities` | Города с кинотеатрами |
| GET | `api/v1/public/movies/genres` | Список жанров |
| GET | `api/v1/public/movies/active-cinemas` | Активные кинотеатры |
| GET | `api/v1/public/movies/nearest-cinemas` | Ближайшие кинотеатры (GPS) |
| GET | `api/v1/public/movies/search-schedules` | Расширенный поиск сеансов |
| GET | `api/v1/public/movies/{movieId}` | Детали фильма |
| GET | `api/v1/public/movies/{movieId}/similar` | Похожие фильмы |

### Use Cases
| Use Case | Описание |
|---|---|
| `GetNowShowingUseCase` | Список текущих фильмов |
| `GetComingSoonUseCase` | Список предстоящих фильмов |
| `GetMovieDetailUseCase` | Детали фильма |
| `GetSimilarMoviesUseCase` | Похожие фильмы (векторный поиск в Qdrant) |
| `GetNearestCinemasUseCase` | Ближайшие кинотеатры (Haversine) |
| `SearchSchedulesUseCase` | Поиск сеансов с фильтрами |

### Domain Entities
| Сущность | Описание |
|---|---|
| `Movie` | Фильм (Title, Description, PosterUrl, Duration, ReleaseDate) |
| `MovieFormat` | Формат (2D, 3D, IMAX, 4DX) |
| `Genre` | Жанр |
| `AgeRating` | Возрастной рейтинг (P, K, T13, T16, T18, C) |
| `Cinema` | Кинотеатр (Name, Address, City, Lat, Lng) |

### Enums
| Enum | Значения |
|---|---|
| `MovieStatus` | NowShowing, ComingSoon, Ended |
| `AgeRatingEnum` | P, K, T13, T16, T18, C |
