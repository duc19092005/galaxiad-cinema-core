# Управление объектами — Facilities Management

> Управление физическими объектами: кинотеатры, залы, схемы мест, отделы.

## Обзор

Позволяет Facilities Manager:
1. CRUD кинотеатров
2. Управление залами
3. Настройка схем мест
4. Управление отделами

> [!NOTE]
> **Delete endpoint не реализованы**: `DeleteCinemaUseCase` и `DeleteAuditoriumUseCase` зарегистрированы в DI, но не имеют endpoint контроллера.

## Frontend

### Routes
| Маршрут | Компонент | Описание |
|---|---|---|
| `/facilities-manager` | `FacilitiesManagerPage` | Дашборд управления объектами |

### Ключевые компоненты
- **`CinemaTable`**: Таблица кинотеатров
- **`CinemaFormModal`**: Модал добавления/редактирования кинотеатра
- **`AuditoriumTable`**: Таблица залов
- **`AuditoriumFormModal`**: Модал зала
- **`SeatLayoutEditor`**: Редактор схемы мест (drag & drop)
- **`SeatGridPreview`**: Превью схемы мест
- **`DepartmentTable`**: Таблица отделов
- **`DepartmentFormModal`**: Модал отдела

## Backend

### API Endpoints
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `api/facilities/cinema` | Список кинотеатров |
| POST | `api/facilities/cinema` | Создать кинотеатр |
| PUT | `api/facilities/cinema` | Обновить кинотеатр |
| GET | `api/facilities/auditorium` | Список залов |
| POST | `api/facilities/auditorium` | Создать зал |
| PUT | `api/facilities/auditorium` | Обновить зал |
| GET | `api/facilities/departments` | Список отделов |
| POST | `api/facilities/departments` | Создать отдел |
| PUT | `api/facilities/departments` | Обновить отдел |
| DELETE | `api/facilities/departments` | Удалить отдел |
| GET | `api/facilities/movie-format` | Список форматов |

### Use Cases
| Use Case | Описание |
|---|---|
| `CreateCinemaUseCase` | Создать кинотеатр |
| `UpdateCinemaUseCase` | Обновить кинотеатр |
| `GetCinemasUseCase` | Список кинотеатров |
| `DeleteCinemaUseCase` | **Нет endpoint** |
| `CreateAuditoriumUseCase` | Создать зал |
| `UpdateAuditoriumUseCase` | Обновить зал |
| `GetAuditoriumsUseCase` | Список залов |
| `DeleteAuditoriumUseCase` | **Нет endpoint** |
| `UpsertSeatLayoutUseCase` | Полная замена схемы мест |
| `GetSeatLayoutUseCase` | Получить схему мест |
| `CreateDepartmentUseCase` | Создать отдел |
| `UpdateDepartmentUseCase` | Обновить отдел |
| `DeleteDepartmentUseCase` | Удалить отдел |

### Domain Entities
| Сущность | Описание |
|---|---|
| `Cinema` | Кинотеатр (Name, Address, City, Lat, Lng, Status) |
| `Auditorium` | Зал (Name, Capacity, CinemaId, SupportedFormats) |
| `Seat` | Место (AuditoriumId, Row, Column, Label, SeatType) |
| `Department` | Отдел (Name, CinemaId, SharedAccountId) |
| `MovieFormat` | Формат (2D, 3D, IMAX, 4DX) |

### Enums
| Enum | Значения |
|---|---|
| `SeatType` | Normal, VIP, Couple, Wheelchair |
| `CinemaStatus` | Active, Inactive |
| `MovieFormatType` | TwoD, ThreeD, IMAX, FourDX |
