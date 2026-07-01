# Theater Management

> Movie schedules, AI showtime recommendations, shift templates, staff profiles, and payroll.

## Overview

Theater Manager covers 3 main areas:
1. **Movie Schedules** — CRUD, AI showtime recommendations
2. **Shifts** — Templates, registration, approval
3. **Staff & Payroll** — Profiles, payroll calculation

## Frontend

### Routes
| Route | Component | Description |
|---|---|---|
| `/theater-manager` | `TheaterManagerPage` | Theater management dashboard |
| `/theater-manager/:tab` | `TheaterManagerPage` | Tab view |
| `/schedule` | `SchedulePage` | Schedule view |

### Key Components
- **`ScheduleCalendar`**: Calendar/timeline schedule view
- **`ScheduleFormModal`**: Add/edit schedule modal
- **`AIRecommendationPanel`**: AI showtime recommendation panel
- **`RecommendationPreview`**: Preview before applying
- **`ShiftTemplateTable`**: Shift template list
- **`ShiftTemplateFormModal`**: Create/edit template modal
- **`ShiftRegistrationTable`**: Pending registrations
- **`ShiftApprovalButton`**: Approve/reject buttons
- **`StaffProfileCard`**: Staff profile card
- **`StaffProfileFormModal`**: Add/edit profile modal
- **`PayrollTable`**: Payroll table
- **`PayrollCalculateButton`**: Calculate payroll button

## Backend

### API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `api/TheaterManager/MovieSchedules` | Schedule list |
| POST | `api/TheaterManager/MovieSchedules` | Create schedule |
| PUT | `api/TheaterManager/MovieSchedules/{id}` | Update schedule |
| DELETE | `api/TheaterManager/MovieSchedules/{id}` | Delete schedule |
| GET | `api/TheaterManager/MovieScheduleRecommendations/generate` | Generate AI recommendations |
| GET | `api/TheaterManager/MovieScheduleRecommendations/preview` | Preview recommendations |
| POST | `api/TheaterManager/MovieScheduleRecommendations/apply` | Apply recommendations |
| POST | `api/TheaterManager/MovieScheduleRecommendations/dismiss` | Dismiss recommendations |
| GET | `api/TheaterManager/Shifts/templates` | Shift template list |
| POST | `api/TheaterManager/Shifts/templates` | Create template |
| PUT | `api/TheaterManager/Shifts/templates/{id}` | Update template |
| GET | `api/TheaterManager/Shifts/registrations` | Registration list |
| POST | `api/TheaterManager/Shifts/approve` | Approve registration |
| POST | `api/TheaterManager/Shifts/reject` | Reject registration |
| GET | `api/TheaterManager/Shifts/staff-profiles` | Staff profile list |
| POST | `api/TheaterManager/Shifts/staff-profiles` | Create profile |
| PUT | `api/TheaterManager/Shifts/staff-profiles/{id}` | Update profile |
| GET | `api/TheaterManager/Shifts/payroll` | Payroll list |
| POST | `api/TheaterManager/Shifts/payroll/calculate` | Calculate payroll |
| POST | `api/TheaterManager/Shifts/payroll/pay` | Pay payroll |

### Use Cases (22+)
#### Schedules
| Use Case | Description |
|---|---|
| `CreateMovieScheduleUseCase` | Create schedule |
| `UpdateMovieScheduleUseCase` | Update schedule |
| `DeleteMovieScheduleUseCase` | Delete schedule |
| `GetMovieSchedulesUseCase` | Get schedule list |
| `GenerateRecommendationsUseCase` | Generate AI recommendations |
| `PreviewRecommendationsUseCase` | Preview recommendations |
| `ApplyRecommendationsUseCase` | Apply recommendations |
| `DismissRecommendationsUseCase` | Dismiss recommendations |

#### Shifts
| Use Case | Description |
|---|---|
| `CreateShiftTemplateUseCase` | Create shift template |
| `UpdateShiftTemplateUseCase` | Update template |
| `GetShiftTemplatesUseCase` | Get template list |
| `GetShiftRegistrationsUseCase` | Get registration list |
| `ApproveShiftRegistrationUseCase` | Approve registration |
| `RejectShiftRegistrationUseCase` | Reject registration |

#### Staff & Payroll
| Use Case | Description |
|---|---|
| `CreateStaffProfileUseCase` | Create staff profile |
| `UpdateStaffProfileUseCase` | Update profile |
| `GetStaffProfilesUseCase` | Get profile list |
| `CalculatePayrollUseCase` | Calculate payroll |
| `PayPayrollUseCase` | Pay payroll |
| `GetPayrollUseCase` | Get payroll list |

### Domain Entities
| Entity | Description |
|---|---|
| `MovieSchedule` | Schedule (MovieId, AuditoriumId, Format, StartTime, EndTime) |
| `ScheduleRecommendation` | AI recommendation (MovieId, AuditoriumId, Score, Status) |
| `ShiftTemplate` | Shift template (Name, StartTime, EndTime, Type) |
| `ShiftRegistration` | Registration (StaffId, ShiftId, Status) |
| `StaffProfile` | Staff profile (Name, Role, HourlyRate, Type) |
| `Payroll` | Payroll (StaffId, Period, Amount, Status) |

### Enums
| Enum | Values |
|---|---|
| `RecommendationStatus` | Pending, Previewed, Applied, Dismissed, Failed |
| `ShiftType` | FullTime, PartTime, Rotating |
| `RegistrationStatus` | Pending, Approved, Rejected, Cancelled |
| `StaffType` | FullTime, PartTime |
| `PayrollStatus` | Pending, Paid |

## Data Flow

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
→ Recommendation list → Preview → Apply (re-validate all rules) → Save audit
```

### Schedule Creation
```
Theater Manager → /theater-manager → Schedule tab →
ScheduleCalendar → Select date → View schedule →
Add/Edit → POST/PUT → Backend validates:
  - Format compatibility
  - 15-min cleaning gap
  - No overlap
  - No past time
  - Operating hours (06:00 - 02:00)
```
