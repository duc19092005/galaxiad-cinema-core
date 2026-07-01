# Danh sách phim & Chi tiết phim — Movie Catalog

> Module tra cứu phim với tìm kiếm nâng cao và gợi ý phim tương tự (vector search).

## Tổng quan

Module cho phép khách hàng:
1. Xem danh sách phim đang chiếu và sắp chiếu
2. Xem chi tiết phim (thông tin, trailer, đánh giá)
3. Xem phim tương tự dựa trên vector similarity search
4. Tìm kiếm nâng cao với nhiều bộ lọc
5. Xem rạp gần nhất dựa trên GPS

## Frontend

### Routes
| Route | Component | Mô tả |
|---|---|---|
| `/movies` | `MovieListPage` | Danh sách phim (now showing / coming soon) |
| `/movie/:movieId` | `MovieDetailPage` | Chi tiết phim + suất chiếu |
| `/movie/:movieId/similar` | `SimilarMoviesSection` | Phim tương tự |

### Components chính
- **`MovieCard`**: Card hiển thị phim (poster, tên, rating, thể loại)
- **`MovieGrid`**: Grid hiển thị danh sách phim
- **`MovieFilterBar`**: Thanh lọc (thể loại, định dạng, ngôn ngữ, ngày)
- **`MovieSearchInput`**: Ô tìm kiếm phim với autocomplete
- **`MovieDetailHero`**: Hero section chi tiết phim (poster lớn, thông tin)
- **`MovieInfoSection`**: Thông tin phim (mô tả, đạo diễn, diễn viên)
- **`ShowtimeList`**: Danh sách suất chiếu theo rạp và ngày
- **`SimilarMovieCard`**: Card phim tương tự
- **`GPSNearestCinemas`**: Danh sách rạp gần nhất theo GPS

## Backend

### API Endpoints
| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `api/v1/public/movies/now-showing` | Phim đang chiếu |
| GET | `api/v1/public/movies/coming-soon` | Phim sắp chiếu |
| GET | `api/v1/public/movies/cities` | Danh sách thành phố có rạp |
| GET | `api/v1/public/movies/genres` | Danh sách thể loại |
| GET | `api/v1/public/movies/active-cinemas` | Rạp đang hoạt động |
| GET | `api/v1/public/movies/nearest-cinemas` | Rạp gần nhất (theo GPS) |
| GET | `api/v1/public/movies/search-schedules` | Tìm kiếm suất chiếu nâng cao |
| GET | `api/v1/public/movies/{movieId}` | Chi tiết phim |
| GET | `api/v1/public/movies/{movieId}/similar` | Phim tương tự |

### Use Cases
| Use Case | Mô tả |
|---|---|
| `GetNowShowingUseCase` | Lấy danh sách phim đang chiếu |
| `GetComingSoonUseCase` | Lấy danh sách phim sắp chiếu |
| `GetMovieDetailUseCase` | Lấy chi tiết phim |
| `GetSimilarMoviesUseCase` | Gợi ý phim tương tự (vector search) |
| `GetNearestCinemasUseCase` | Tìm rạp gần nhất |
| `SearchSchedulesUseCase` | Tìm kiếm suất chiếu với filter |

### Domain Entities
| Entity | Mô tả |
|---|---|
| `Movie` | Phim (Title, Description, PosterUrl, Duration, ReleaseDate) |
| `MovieFormat` | Định dạng phim (2D, 3D, IMAX, 4DX) |
| `Genre` | Thể loại phim |
| `MovieGenre` | Liên kết Movie-Genre |
| `AgeRating` | Phân loại độ tuổi (P, K, T13, T16, T18, C) |
| `Cinema` | Rạp chiếu (Name, Address, City, Lat, Lng) |
| `MovieSchedule` | Lịch chiếu |

### Enums
| Enum | Values |
|---|---|
| `MovieStatus` | NowShowing, ComingSoon, Ended |
| `AgeRatingEnum` | P, K, T13, T16, T18, C |

## Luồng xử lý

### Danh sách phim
```
User → /movies → MovieListPage → GET now-showing/coming-soon →
Hiển thị MovieGrid → Filter → GET với query params → Cập nhật grid
```

### Chi tiết phim & phim tương tự
```
User → Click movie card → /movie/:movieId → GET movie detail →
GET similar movies (vector search trong Qdrant) →
Hiển thị MovieDetailHero + ShowtimeList + SimilarMoviesSection
```

### Tìm kiếm rạp gần nhất
```
User → Cho phép truy cập GPS → GET nearest-cinemas?lat=X&lng=Y →
Backend tính khoảng cách Haversine → Trả về danh sách rạp gần nhất
```
