# Quản lý lịch chiếu & Ca làm — Theater Manager

> Module quản lý lịch chiếu phim, gợi ý AI, ca làm nhân viên, và bảng lương.

## Tổng quan

Theater Manager là module lớn, quản lý 3 mảng chính:
1. **Lịch chiếu (Movie Schedules)** — CRUD, AI gợi ý lịch chiếu
2. **Ca làm (Shifts)** — Template ca, đăng ký ca, phê duyệt
3. **Nhân sự & Lương** — Hồ sơ nhân viên, tính lương

## Frontend

### Routes
| Route | Component | Mô tả |
|---|---|---|
| `/theater-manager` | `TheaterManagerPage` | Dashboard quản lý rạp |
| `/theater-manager/:tab` | `TheaterManagerPage` | Tab (schedules, shifts, staff, payroll) |
| `/schedule` | `SchedulePage` | Lịch chiếu |

### Components chính
- **`ScheduleCalendar`**: Lịch chiếu dạng calendar/timeline
- **`ScheduleFormModal`**: Modal thêm/sửa lịch chiếu
- **`ScheduleTable`**: Bảng danh sách lịch chiếu
- **`AIRecommendationPanel`**: Panel gợi ý lịch chiếu AI
- **`RecommendationPreview`**: Preview gợi ý trước khi áp dụng
- **`ShiftTemplateTable`**: Bảng template ca làm
- **`ShiftTemplateFormModal`**: Modal tạo/sửa template
- **`ShiftRegistrationTable`**: Bảng đăng ký ca chờ duyệt
- **`ShiftApprovalButton`**: Nút phê duyệt/từ chối ca
- **`StaffProfileCard`**: Card hồ sơ nhân viên
- **`StaffProfileFormModal`**: Modal thêm/sửa hồ sơ
- **`PayrollTable`**: Bảng lương
- **`PayrollCalculateButton`**: Nút tính lương

## Backend

### API Endpoints
| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `api/TheaterManager/MovieSchedules` | Danh sách lịch chiếu |
| POST | `api/TheaterManager/MovieSchedules` | Thêm lịch chiếu |
| PUT | `api/TheaterManager/MovieSchedules/{id}` | Cập nhật lịch chiếu |
| DELETE | `api/TheaterManager/MovieSchedules/{id}` | Xóa lịch chiếu |
| GET | `api/TheaterManager/MovieScheduleRecommendations/generate` | Tạo gợi ý AI |
| GET | `api/TheaterManager/MovieScheduleRecommendations/preview` | Xem trước gợi ý |
| POST | `api/TheaterManager/MovieScheduleRecommendations/apply` | Áp dụng gợi ý |
| POST | `api/TheaterManager/MovieScheduleRecommendations/dismiss` | Bỏ qua gợi ý |
| GET | `api/TheaterManager/Shifts/templates` | Danh sách template ca |
| POST | `api/TheaterManager/Shifts/templates` | Tạo template ca |
| PUT | `api/TheaterManager/Shifts/templates/{id}` | Cập nhật template |
| GET | `api/TheaterManager/Shifts/registrations` | Danh sách đăng ký ca |
| POST | `api/TheaterManager/Shifts/approve` | Phê duyệt đăng ký |
| POST | `api/TheaterManager/Shifts/reject` | Từ chối đăng ký |
| GET | `api/TheaterManager/Shifts/staff-profiles` | Danh sách hồ sơ nhân viên |
| POST | `api/TheaterManager/Shifts/staff-profiles` | Thêm hồ sơ |
| PUT | `api/TheaterManager/Shifts/staff-profiles/{id}` | Cập nhật hồ sơ |
| GET | `api/TheaterManager/Shifts/payroll` | Bảng lương |
| POST | `api/TheaterManager/Shifts/payroll/calculate` | Tính lương |
| POST | `api/TheaterManager/Shifts/payroll/pay` | Thanh toán lương |

### Use Cases (22+)
#### Schedules
| Use Case | Mô tả |
|---|---|
| `CreateMovieScheduleUseCase` | Tạo lịch chiếu mới |
| `UpdateMovieScheduleUseCase` | Cập nhật lịch chiếu |
| `DeleteMovieScheduleUseCase` | Xóa lịch chiếu |
| `GetMovieSchedulesUseCase` | Lấy danh sách lịch chiếu |
| `GenerateRecommendationsUseCase` | AI gợi ý lịch chiếu |
| `PreviewRecommendationsUseCase` | Xem trước gợi ý |
| `ApplyRecommendationsUseCase` | Áp dụng gợi ý |
| `DismissRecommendationsUseCase` | Bỏ qua gợi ý |

#### Shifts
| Use Case | Mô tả |
|---|---|
| `CreateShiftTemplateUseCase` | Tạo template ca |
| `UpdateShiftTemplateUseCase` | Cập nhật template |
| `GetShiftTemplatesUseCase` | Danh sách template |
| `GetShiftRegistrationsUseCase` | Danh sách đăng ký ca |
| `ApproveShiftRegistrationUseCase` | Phê duyệt ca |
| `RejectShiftRegistrationUseCase` | Từ chối ca |

#### Staff & Payroll
| Use Case | Mô tả |
|---|---|
| `CreateStaffProfileUseCase` | Thêm hồ sơ nhân viên |
| `UpdateStaffProfileUseCase` | Cập nhật hồ sơ |
| `GetStaffProfilesUseCase` | Danh sách hồ sơ |
| `CalculatePayrollUseCase` | Tính lương |
| `PayPayrollUseCase` | Thanh toán lương |
| `GetPayrollUseCase` | Lấy bảng lương |

### Domain Entities
| Entity | Mô tả |
|---|---|
| `MovieSchedule` | Lịch chiếu (MovieId, AuditoriumId, Format, StartTime, EndTime) |
| `ScheduleRecommendation` | Gợi ý lịch chiếu (MovieId, AuditoriumId, Score, Status) |
| `ShiftTemplate` | Mẫu ca làm (Name, StartTime, EndTime, Type) |
| `ShiftRegistration` | Đăng ký ca làm (StaffId, ShiftId, Status) |
| `StaffProfile` | Hồ sơ nhân viên (Name, Role, HourlyRate, Type) |
| `Payroll` | Bảng lương (StaffId, Period, Amount, Status) |

### Enums
| Enum | Values |
|---|---|
| `RecommendationStatus` | Pending, Previewed, Applied, Dismissed, Failed |
| `ShiftType` | FullTime, PartTime, Rotating |
| `RegistrationStatus` | Pending, Approved, Rejected, Cancelled |
| `StaffType` | FullTime, PartTime |
| `PayrollStatus` | Pending, Paid |

## Luồng xử lý

### AI Showtime Recommendations
```
Theater Manager → Click "Generate AI Recommendations" → GET generate →
Backend scoring (deterministic rules on real data):
  1. Paid ticket trends & revenue
  2. Movie view/search signals
  3. Ratings & comments
  4. Movie release freshness
  5. Auditorium capacity & format support
  6. Prime-time windows
→ Danh sách gợi ý → Preview → Apply (re-validate all rules) → Lưu audit
```

### Lịch chiếu
```
Theater Manager → /theater-manager → Tab Schedules →
ScheduleCalendar → Chọn ngày → Xem lịch →
Add/Edit → POST/PUT → Backend validate:
  - Format compatibility
  - 15-min cleaning gap
  - No overlap
  - No past time
  - Operating hours (06:00 - 02:00)
```

### Quản lý ca làm
```
Theater Manager → Shift Templates → Tạo template →
Staff đăng ký ca → Theater Manager xem registrations →
Phê duyệt/Từ chối → Staff nhận thông báo →
Cuối kỳ → Calculate Payroll → Pay
```
