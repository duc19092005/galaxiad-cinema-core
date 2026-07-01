# Quản lý phim — Movie Management

> Module quản lý thông tin phim: thêm, sửa, xóa phim, định dạng, thể loại.

## Tổng quan

Movie Management cho phép Movie Manager:
1. CRUD thông tin phim
2. Quản lý định dạng phim (2D, 3D, IMAX, 4DX)
3. Quản lý thể loại và phân loại độ tuổi
4. Quản lý trạng thái phim (Now Showing / Coming Soon)

> [!WARNING]
> **DELETE endpoint bị hỏng**: Frontend gọi `DELETE /api/movieManager/movies/{id}` nhưng backend chưa có endpoint tương ứng. `DeleteMovieUseCase` đã có trong DI nhưng chưa được wire vào controller.

## Frontend

### Routes
| Route | Component | Mô tả |
|---|---|---|
| `/movie-manager` | `MovieManagerPage` | Dashboard quản lý phim |

### Components chính
- **`MovieTable`**: Bảng danh sách phim
- **`MovieFormModal`**: Modal thêm/sửa phim
- **`MovieFormatTag`**: Tag hiển thị định dạng phim
- **`GenreMultiSelect`**: Chọn thể loại (multi-select)
- **`AgeRatingSelect`**: Chọn phân loại độ tuổi
- **`MovieStatusToggle`**: Chuyển đổi trạng thái phim

## Backend

### API Endpoints
| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `api/movieManager/movies` | Danh sách phim |
| GET | `api/movieManager/movies/{id}` | Chi tiết phim |
| POST | `api/movieManager/movies` | Thêm phim mới |
| PUT | `api/movieManager/movies/{id}` | Cập nhật phim |
| GET | `api/movieManager/movie-formats` | Danh sách định dạng |
| POST | `api/movieManager/movie-formats` | Thêm định dạng |
| GET | `api/movieManager/genres` | Danh sách thể loại |
| POST | `api/movieManager/genres` | Thêm thể loại |
| GET | `api/movieManager/age-ratings` | Danh sách phân loại độ tuổi |

### Use Cases
| Use Case | Mô tả |
|---|---|
| `CreateMovieUseCase` | Thêm phim mới |
| `UpdateMovieUseCase` | Cập nhật phim |
| `DeleteMovieUseCase` | **Chưa wire vào controller — broken** |
| `GetMoviesUseCase` | Lấy danh sách phim |
| `GetMovieDetailUseCase` | Lấy chi tiết phim |
| `CreateMovieFormatUseCase` | Thêm định dạng phim |
| `CreateGenreUseCase` | Thêm thể loại |

### Domain Entities
| Entity | Mô tả |
|---|---|
| `MovieInfo` | Thông tin phim (Title, Description, PosterUrl, Duration, ReleaseDate) |
| `MovieFormat` | Định dạng phim (2D, 3D, IMAX, 4DX) |
| `Genre` | Thể loại phim |
| `MovieGenre` | Liên kết Movie-Genre |
| `AgeRating` | Phân loại độ tuổi (P, K, T13, T16, T18, C) |

## Luồng xử lý

### Thêm phim
```
Movie Manager → /movie-manager → Click "Add Movie" → MovieFormModal →
Nhập thông tin → Chọn thể loại → Chọn định dạng → POST →
Backend validate → Lưu MovieInfo + MovieGenre mapping → Refresh table
```

### Xóa phim (broken)
```
Movie Manager → Click delete → DELETE api/movieManager/movies/{id} →
❌ 404 Not Found (endpoint chưa implement)
```
