# Facilities Management

> Physical facilities management: cinemas, auditoriums, seat layouts, and departments.

## Overview

Allows Facilities Manager to:
1. CRUD cinemas
2. Manage auditoriums
3. Configure seat layouts
4. Manage departments

> [!NOTE]
> **Delete endpoints not implemented**: `DeleteCinemaUseCase` and `DeleteAuditoriumUseCase` are DI-registered but have no controller endpoints.

## Frontend

### Routes
| Route | Component | Description |
|---|---|---|
| `/facilities-manager` | `FacilitiesManagerPage` | Facilities management dashboard |

### Key Components
- **`CinemaTable`**: Cinema list table
- **`CinemaFormModal`**: Add/edit cinema modal
- **`AuditoriumTable`**: Auditorium list table
- **`AuditoriumFormModal`**: Add/edit auditorium modal
- **`SeatLayoutEditor`**: Drag & drop seat layout editor
- **`SeatGridPreview`**: Seat layout preview
- **`DepartmentTable`**: Department list table
- **`DepartmentFormModal`**: Add/edit department modal

## Backend

### API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `api/facilities/cinema` | Cinema list |
| POST | `api/facilities/cinema` | Create cinema |
| PUT | `api/facilities/cinema` | Update cinema |
| GET | `api/facilities/auditorium` | Auditorium list |
| POST | `api/facilities/auditorium` | Create auditorium |
| PUT | `api/facilities/auditorium` | Update auditorium |
| GET | `api/facilities/departments` | Department list |
| POST | `api/facilities/departments` | Create department |
| PUT | `api/facilities/departments` | Update department |
| DELETE | `api/facilities/departments` | Delete department |
| GET | `api/facilities/movie-format` | Movie format list |

### Use Cases
| Use Case | Description |
|---|---|
| `CreateCinemaUseCase` | Create cinema |
| `UpdateCinemaUseCase` | Update cinema |
| `GetCinemasUseCase` | Get cinema list |
| `DeleteCinemaUseCase` | **No controller endpoint** |
| `CreateAuditoriumUseCase` | Create auditorium |
| `UpdateAuditoriumUseCase` | Update auditorium |
| `GetAuditoriumsUseCase` | Get auditorium list |
| `DeleteAuditoriumUseCase` | **No controller endpoint** |
| `UpsertSeatLayoutUseCase` | Full-replace seat layout |
| `GetSeatLayoutUseCase` | Get seat layout |
| `CreateDepartmentUseCase` | Create department |
| `UpdateDepartmentUseCase` | Update department |
| `DeleteDepartmentUseCase` | Delete department |

### Domain Entities
| Entity | Description |
|---|---|
| `Cinema` | Cinema (Name, Address, City, Lat, Lng, Status) |
| `Auditorium` | Auditorium (Name, Capacity, CinemaId, SupportedFormats) |
| `Seat` | Seat (AuditoriumId, Row, Column, Label, SeatType) |
| `Department` | Department (Name, CinemaId, SharedAccountId) |
| `MovieFormat` | Movie format (2D, 3D, IMAX, 4DX) |

### Enums
| Enum | Values |
|---|---|
| `SeatType` | Normal, VIP, Couple, Wheelchair |
| `CinemaStatus` | Active, Inactive |
| `MovieFormatType` | TwoD, ThreeD, IMAX, FourDX |

## Data Flow

### Seat Layout
```
Facilities Manager → /facilities-manager → Select cinema → Select auditorium →
SeatLayoutEditor → Drag/drop seats → Confirm → PUT seats (full replace)
```

> [!NOTE]
> Seat layout uses full replace — each update overwrites the entire layout. Validation: continuous rows/columns, no gaps, no duplicate positions.
