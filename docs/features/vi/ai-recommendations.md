# Gợi ý phim AI — AI Recommendations

> Module gợi ý phim cá nhân hóa dựa trên vector embedding và Qdrant vector database.

## Tổng quan

AI Recommendations cung cấp:
1. **Preference Survey** — Khảo sát sở thích xem phim
2. **Personalized Recommendations** — Gợi ý phim cá nhân hóa
3. **Vector Embedding Sync** — Đồng bộ embedding phim lên Qdrant
4. **Similar Movies** — Tìm phim tương tự (cũng dùng vector search)

## Frontend

### Routes
Survey modal xuất hiện trên home page:
| Route | Component | Mô tả |
|---|---|---|
| `/` | `HomePage` → `SurveyModal` | Khảo sát sở thích trên trang chủ |

### Components chính
- **`SurveyModal`**: Modal khảo sát sở thích
- **`GenreSelector`**: Chọn thể loại yêu thích
- **`RatingSelector`**: Chọn mức đánh giá tối thiểu
- **`YearRangeSelector`**: Chọn khoảng năm
- **`RecommendedMovieList`**: Danh sách phim gợi ý
- **`RecommendedMovieCard`**: Card phim gợi ý (hiển thị lý do gợi ý)

## Backend

### API Endpoints
| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `api/v1/Recommendation/survey/status` | Kiểm tra user đã survey chưa |
| POST | `api/v1/Recommendation/survey` | Gửi kết quả survey |
| GET | `api/v1/Recommendation/movies` | Lấy gợi ý phim cá nhân hóa |
| POST | `api/v1/Recommendation/sync-movies` | Đồng bộ movie embedding lên Qdrant |

### Use Cases
| Use Case | Mô tả |
|---|---|
| `GetSurveyStatusUseCase` | Kiểm tra trạng thái survey |
| `SubmitSurveyUseCase` | Lưu kết quả survey |
| `GetRecommendedMoviesUseCase` | Lấy gợi ý phim từ Qdrant |
| `SyncMoviesToVectorDbUseCase` | Đồng bộ embedding lên Qdrant |

### Domain Entities
| Entity | Mô tả |
|---|---|
| `UserPreference` | Sở thích user (GenreIds, MinRating, YearFrom, YearTo) |
| `MovieEmbedding` | Vector embedding của phim (MovieId, Vector, UpdatedAt) |

## Luồng xử lý

### Khảo sát & Gợi ý
```
User → / → SurveyModal → Chọn thể loại yêu thích →
Chọn rating tối thiểu → Chọn năm → POST survey →
Backend lưu preferences → [Sync movies to Qdrant nếu chưa có] →
GET recommended movies → Vector search trong Qdrant →
Cosine similarity → Top-N movies → Hiển thị RecommendedMovieList
```

### Đồng bộ Embedding
```
Khi service start → POST sync-movies →
Backend lấy danh sách phim active →
Tạo vector embedding (title + description + genres) →
Upsert vào Qdrant collection
```

## Ghi chú

> [!NOTE]
> - **Vector Database**: Qdrant
> - **Search Method**: Cosine similarity
> - **Sync**: Tự động sync khi service start, hoặc manual qua API
> - Tương tự cho similar movies trong [Movie Catalog](./movie-catalog.md)
