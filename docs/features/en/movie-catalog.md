# Movie Catalog & Detail

> Movie browsing module with advanced search, vector similarity, and GPS-based nearest cinemas.

## Overview

Allows customers to:
1. Browse now showing and coming soon movies
2. View movie details (info, trailer, ratings)
3. Discover similar movies via vector similarity search
4. Advanced search with multiple filters
5. Find nearest cinemas using GPS coordinates

## Frontend

### Routes
| Route | Component | Description |
|---|---|---|
| `/movies` | `MovieListPage` | Movie listing (now showing / coming soon) |
| `/movie/:movieId` | `MovieDetailPage` | Movie detail + showtimes |
| `/movie/:movieId/similar` | `SimilarMoviesSection` | Similar movies |

### Key Components
- **`MovieCard`**: Movie card (poster, title, rating, genre)
- **`MovieGrid`**: Movie list grid
- **`MovieFilterBar`**: Filter bar (genre, format, language, date)
- **`MovieSearchInput`**: Search with autocomplete
- **`MovieDetailHero`**: Hero section (large poster, info)
- **`MovieInfoSection`**: Movie details (description, director, cast)
- **`ShowtimeList`**: Showtimes by cinema and date
- **`SimilarMovieCard`**: Similar movie card
- **`GPSNearestCinemas`**: Nearest cinema list via GPS

## Backend

### API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `api/v1/public/movies/now-showing` | Now showing movies |
| GET | `api/v1/public/movies/coming-soon` | Coming soon movies |
| GET | `api/v1/public/movies/cities` | Cities with cinemas |
| GET | `api/v1/public/movies/genres` | Genre list |
| GET | `api/v1/public/movies/active-cinemas` | Active cinemas |
| GET | `api/v1/public/movies/nearest-cinemas` | GPS nearest cinemas |
| GET | `api/v1/public/movies/search-schedules` | Advanced schedule search |
| GET | `api/v1/public/movies/{movieId}` | Movie detail |
| GET | `api/v1/public/movies/{movieId}/similar` | Similar movies |

### Use Cases
| Use Case | Description |
|---|---|
| `GetNowShowingUseCase` | Now showing movie list |
| `GetComingSoonUseCase` | Coming soon movie list |
| `GetMovieDetailUseCase` | Movie detail |
| `GetSimilarMoviesUseCase` | Similar movies (vector search in Qdrant) |
| `GetNearestCinemasUseCase` | Nearest cinemas via Haversine distance |
| `SearchSchedulesUseCase` | Schedule search with filters |

### Domain Entities
| Entity | Description |
|---|---|
| `Movie` | Movie (Title, Description, PosterUrl, Duration, ReleaseDate) |
| `MovieFormat` | Format (2D, 3D, IMAX, 4DX) |
| `Genre` | Genre |
| `MovieGenre` | Movie-Genre mapping |
| `AgeRating` | Age rating (P, K, T13, T16, T18, C) |
| `Cinema` | Cinema (Name, Address, City, Lat, Lng) |
| `MovieSchedule` | Schedule |

### Enums
| Enum | Values |
|---|---|
| `MovieStatus` | NowShowing, ComingSoon, Ended |
| `AgeRatingEnum` | P, K, T13, T16, T18, C |

## Data Flow

### Movie List
```
User → /movies → MovieListPage → GET now-showing/coming-soon →
Display MovieGrid → Filter → GET with query params → Update grid
```

### Movie Detail & Similar
```
User → Click movie card → /movie/:movieId → GET movie detail →
GET similar movies (vector search in Qdrant) →
Show MovieDetailHero + ShowtimeList + SimilarMoviesSection
```

### Nearest Cinemas
```
User → Enable GPS → GET nearest-cinemas?lat=X&lng=Y →
Backend calculates Haversine distance → Returns nearest cinemas
```
