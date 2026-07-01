# Movie Management

> Movie information management: CRUD, formats, genres, and age ratings.

## Overview

Allows Movie Manager to:
1. CRUD movie information
2. Manage movie formats (2D, 3D, IMAX, 4DX)
3. Manage genres and age ratings
4. Manage movie status (Now Showing / Coming Soon)

> [!WARNING]
> **DELETE endpoint broken**: Frontend calls `DELETE /api/movieManager/movies/{id}` but backend has no matching endpoint. `DeleteMovieUseCase` exists in DI but isn't wired to a controller.

## Frontend

### Routes
| Route | Component | Description |
|---|---|---|
| `/movie-manager` | `MovieManagerPage` | Movie management dashboard |

### Key Components
- **`MovieTable`**: Movie list table
- **`MovieFormModal`**: Add/edit movie modal
- **`MovieFormatTag`**: Format display tag
- **`GenreMultiSelect`**: Multi-select genre picker
- **`AgeRatingSelect`**: Age rating selector
- **`MovieStatusToggle`**: Movie status toggle

## Backend

### API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `api/movieManager/movies` | Movie list |
| GET | `api/movieManager/movies/{id}` | Movie detail |
| POST | `api/movieManager/movies` | Create movie |
| PUT | `api/movieManager/movies/{id}` | Update movie |
| GET | `api/movieManager/movie-formats` | Format list |
| POST | `api/movieManager/movie-formats` | Create format |
| GET | `api/movieManager/genres` | Genre list |
| POST | `api/movieManager/genres` | Create genre |
| GET | `api/movieManager/age-ratings` | Age rating list |

### Use Cases
| Use Case | Description |
|---|---|
| `CreateMovieUseCase` | Create movie |
| `UpdateMovieUseCase` | Update movie |
| `DeleteMovieUseCase` | **No controller endpoint — broken** |
| `GetMoviesUseCase` | Get movie list |
| `GetMovieDetailUseCase` | Get movie detail |
| `CreateMovieFormatUseCase` | Create movie format |
| `CreateGenreUseCase` | Create genre |

### Domain Entities
| Entity | Description |
|---|---|
| `MovieInfo` | Movie info (Title, Description, PosterUrl, Duration, ReleaseDate) |
| `MovieFormat` | Format (2D, 3D, IMAX, 4DX) |
| `Genre` | Genre |
| `MovieGenre` | Movie-Genre mapping |
| `AgeRating` | Age rating (P, K, T13, T16, T18, C) |

## Data Flow

### Add Movie
```
Movie Manager → /movie-manager → Click "Add Movie" → MovieFormModal →
Enter info → Select genres → Select formats → POST →
Backend validates → Save MovieInfo + MovieGenre mapping → Refresh table
```

### Delete Movie (broken)
```
Movie Manager → Click delete → DELETE api/movieManager/movies/{id} →
❌ 404 Not Found (endpoint not implemented)
```
