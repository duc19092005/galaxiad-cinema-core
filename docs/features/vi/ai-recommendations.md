# Gợi ý phim AI — AI Recommendations

> Module gợi ý phim cá nhân hóa dựa trên vector embedding và Qdrant vector database.

## Tổng quan

AI Recommendations cung cấp:

1. **Preference Survey** — Khảo sát sở thích xem phim.
2. **Personalized Recommendations** — Gợi ý phim cá nhân hóa.
3. **Vector Embedding Sync** — Đồng bộ embedding phim lên Qdrant.
4. **Similar Movies** — Tìm phim tương tự trên trang chi tiết phim.

## Frontend

### Routes

| Route | Component | Mô tả |
|---|---|---|
| `/` | `HomePage` → `SurveyModal` | Khảo sát sở thích trên trang chủ |

### Components chính

- `SurveyModal`: Modal khảo sát sở thích.
- `RecommendedMovieList`: Danh sách phim gợi ý.
- `RecommendedMovieCard`: Card phim gợi ý.

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
| `SaveSurveyUseCase` | Lưu hoặc cập nhật survey |
| `GetRecommendationsUseCase` | Gợi ý phim cá nhân hóa theo multi-query behavior flow |
| `SyncMoviesToAiServiceUseCase` | Đồng bộ embedding phim lên AI service/Qdrant |

## Luồng xử lý cá nhân hóa hiện tại

```text
User → GET /Recommendation/movies
Backend sync movie embeddings nếu cần
Ưu tiên 1: rating >= 4 trong 30 ngày → multi-query /recommend-by-id từng phim
Ưu tiên 2: không có rating mới → thống kê genre dài hạn từ booked/completed + view/click
Ưu tiên 3: user ít dữ liệu → dùng phim đã tương tác có rating cộng đồng >= 4.0
Fallback: survey preference hoặc trending/popular khi AI/Qdrant lỗi hoặc thiếu kết quả
Trả 5 RecommendedMovieRes cho frontend
```

Chi tiết thuật toán nằm trong [movie-recommendation.md](../../algorithms/vi/movie-recommendation.md).

## Embedding Dimension

AI service dùng `EMBEDDING_DIM=768`. Lý do chọn 768 và biểu đồ benchmark nằm trong [Embedding Dimension Benchmark](../../benchmarks/embedding-dimension-benchmark.md).

## Đồng bộ Embedding

```text
Khi AI service start hoặc admin gọi sync
Backend lấy danh sách phim active/coming-soon
Tạo embedding text từ title + genres + description + director + actors
AI service tạo vector 768 chiều
Upsert vào Qdrant collection cinema_movies
```

## Ghi chú

> [!NOTE]
> - **Vector Database**: Qdrant
> - **Search Method**: Cosine similarity
> - **Default dimension**: 768
> - **Sync**: tự động khi service start hoặc manual qua API
> - Similar movies trong Movie Catalog cũng dùng vector search.
