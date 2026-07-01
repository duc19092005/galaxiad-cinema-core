# Quản lý cơ sở — Facilities Management

> Module quản lý cơ sở vật chất: rạp chiếu, phòng chiếu, sơ đồ ghế, phòng ban.

## Tổng quan

Facilities Management cho phép Facilities Manager:
1. CRUD rạp chiếu phim (Cinema)
2. Quản lý phòng chiếu (Auditorium)
3. Cấu hình sơ đồ ghế (Seat Layout)
4. Quản lý phòng ban (Department)

> [!NOTE]
> **Delete endpoints chưa implemented**: `DeleteCinemaUseCase` và `DeleteAuditoriumUseCase` đã đăng ký DI nhưng chưa có controller endpoint.

## Frontend

### Routes
| Route | Component | Mô tả |
|---|---|---|
| `/facilities-manager` | `FacilitiesManagerPage` | Dashboard quản lý cơ sở |

### Components chính
- **`CinemaTable`**: Bảng danh sách rạp
- **`CinemaFormModal`**: Modal thêm/sửa rạp
- **`AuditoriumTable`**: Bảng danh sách phòng chiếu
- **`AuditoriumFormModal`**: Modal thêm/sửa phòng chiếu
- **`SeatLayoutEditor`**: Editor sơ đồ ghế (drag & drop)
- **`SeatGridPreview`**: Preview sơ đồ ghế
- **`DepartmentTable`**: Bảng danh sách phòng ban
- **`DepartmentFormModal`**: Modal thêm/sửa phòng ban

## Backend

### API Endpoints
| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `api/facilities/cinema` | Danh sách rạp |
| POST | `api/facilities/cinema` | Thêm rạp mới |
| PUT | `api/facilities/cinema` | Cập nhật rạp |
| GET | `api/facilities/auditorium` | Danh sách phòng chiếu |
| POST | `api/facilities/auditorium` | Thêm phòng chiếu |
| PUT | `api/facilities/auditorium` | Cập nhật phòng chiếu |
| GET | `api/facilities/departments` | Danh sách phòng ban |
| POST | `api/facilities/departments` | Thêm phòng ban |
| PUT | `api/facilities/departments` | Cập nhật phòng ban |
| GET | `api/facilities/movie-format` | Danh sách định dạng phim |

### Use Cases
| Use Case | Mô tả |
|---|---|
| `CreateCinemaUseCase` | Thêm rạp mới |
| `UpdateCinemaUseCase` | Cập nhật rạp |
| `GetCinemasUseCase` | Lấy danh sách rạp |
| `DeleteCinemaUseCase` | **Chưa wire vào controller** |
| `CreateAuditoriumUseCase` | Thêm phòng chiếu |
| `UpdateAuditoriumUseCase` | Cập nhật phòng chiếu |
| `GetAuditoriumsUseCase` | Lấy danh sách phòng chiếu |
| `DeleteAuditoriumUseCase` | **Chưa wire vào controller** |
| `UpsertSeatLayoutUseCase` | Cập nhật sơ đồ ghế (full replace) |
| `GetSeatLayoutUseCase` | Lấy sơ đồ ghế |
| `CreateDepartmentUseCase` | Thêm phòng ban |
| `UpdateDepartmentUseCase` | Cập nhật phòng ban |
| `DeleteDepartmentUseCase` | Xóa phòng ban |

### Domain Entities
| Entity | Mô tả |
|---|---|
| `Cinema` | Rạp chiếu (Name, Address, City, Lat, Lng, Status) |
| `Auditorium` | Phòng chiếu (Name, Capacity, CinameId, SupportedFormats) |
| `Seat` | Ghế (AuditoriumId, Row, Column, Label, SeatType) |
| `Department` | Phòng ban (Name, CinemaId, SharedAccountId) |
| `MovieFormat` | Định dạng phim (2D, 3D, IMAX, 4DX) |

### Enums
| Enum | Values |
|---|---|
| `SeatType` | Normal, VIP, Couple, Wheelchair |
| `CinemaStatus` | Active, Inactive |
| `MovieFormatType` | TwoD, ThreeD, IMAX, FourDX |

## Luồng xử lý

### Sơ đồ ghế
```
Facilities Manager → /facilities-manager → Chọn rạp → Chọn phòng chiếu →
SeatLayoutEditor → Kéo/thả ghế → Xác nhận → PUT seats (full replace)
```

> [!NOTE]
> Sơ đồ ghế sử dụng full replace — mỗi lần cập nhật là ghi đè toàn bộ layout.
> Data validation: rows/columns phải continuous, không có gap, không trùng vị trí.
