# AI Movie Recommendations

> Personalized movie recommendations using vector embeddings and Qdrant vector database.

## Overview

Provides:
1. **Preference Survey** — Movie preference questionnaire
2. **Personalized Recommendations** — Tailored movie suggestions
3. **Vector Embedding Sync** — Sync movie embeddings to Qdrant
4. **Similar Movies** — Also uses vector search (see [Movie Catalog](./movie-catalog.md))

## Frontend

### Routes
| Route | Component | Description |
|---|---|---|
| `/` | `HomePage` → `SurveyModal` | Preference survey on home page |

### Key Components
- **`SurveyModal`**: Preference survey modal
- **`GenreSelector`**: Favorite genre selection
- **`RatingSelector`**: Minimum rating selection
- **`YearRangeSelector`**: Year range picker
- **`RecommendedMovieList`**: Personalized movie list
- **`RecommendedMovieCard`**: Movie card with recommendation reason

## Backend

### API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `api/v1/Recommendation/survey/status` | Check if user completed survey |
| POST | `api/v1/Recommendation/survey` | Submit survey response |
| GET | `api/v1/Recommendation/movies` | Get personalized recommendations |
| POST | `api/v1/Recommendation/sync-movies` | Sync movie embeddings to Qdrant |

### Use Cases
| Use Case | Description |
|---|---|
| `GetSurveyStatusUseCase` | Check survey status |
| `SubmitSurveyUseCase` | Save survey response |
| `GetRecommendedMoviesUseCase` | Get recommendations from Qdrant |
| `SyncMoviesToVectorDbUseCase` | Sync embeddings to Qdrant |

### Domain Entities
| Entity | Description |
|---|---|
| `UserPreference` | User preferences (GenreIds, MinRating, YearFrom, YearTo) |
| `MovieEmbedding` | Movie vector embedding (MovieId, Vector, UpdatedAt) |

## Data Flow

### Survey & Recommendations
```
User → Home page → SurveyModal → Select favorite genres →
Select min rating → Select year range → POST survey →
Backend saves preferences → [Sync movies to Qdrant if needed] →
GET recommended movies → Vector search in Qdrant →
Cosine similarity → Top-N movies → Show RecommendedMovieList
```

### Embedding Sync
```
On service start → POST sync-movies →
Backend fetches active movies →
Generates vector embeddings (title + description + genres) →
Upserts into Qdrant collection
```

> [!NOTE]
> - **Vector Database**: Qdrant
> - **Search Method**: Cosine similarity
> - **Sync**: Auto on startup, or manual via API
