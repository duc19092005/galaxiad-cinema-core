# Staff Portal

> Self-service portal for staff: shift registration, clock in/out, history, and payroll.

## Overview

Staff Portal allows employees to:
1. View and register for available shifts
2. Clock in/out with face recognition
3. View working history
4. View payroll information

## Frontend

### Routes
| Route | Component | Description |
|---|---|---|
| `/staff` | `StaffPage` | Staff dashboard |
| `/staff/:tab` | `StaffPage` | Specific tab (shifts, history, payroll) |

### Key Components
- **`AvailableShiftsTable`**: Available shifts list
- **`MyShiftRegistrations`**: Registered shifts
- **`ClockInButton`**: Clock-in button (with face recognition)
- **`ClockOutButton`**: Clock-out button
- **`WorkingHistoryTable`**: Working history table
- **`PayrollInfoCard`**: Payroll information
- **`FaceRecognitionModal`**: Face recognition modal for clock in/out

## Backend

### API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `api/Staff/Shifts/available` | Available shifts |
| POST | `api/Staff/Shifts/register` | Register for shift |
| GET | `api/Staff/Shifts/my-registrations` | My registered shifts |
| POST | `api/Staff/Shifts/clock-in` | Clock-in (face recognition) |
| POST | `api/Staff/Shifts/clock-out` | Clock-out |
| GET | `api/Staff/Shifts/my-history` | Working history |
| GET | `api/Staff/Shifts/my-payroll` | Payroll info |

### Use Cases
| Use Case | Description |
|---|---|
| `GetAvailableShiftsUseCase` | List available shifts |
| `RegisterShiftUseCase` | Register for a shift |
| `GetMyRegistrationsUseCase` | Get registered shifts |
| `ClockInUseCase` | Clock-in (face auth) |
| `ClockOutUseCase` | Clock-out |
| `GetMyHistoryUseCase` | Working history |
| `GetMyPayrollUseCase` | Payroll info |

### Domain Entities
| Entity | Description |
|---|---|
| `ShiftRegistration` | Shift registration (StaffId, ShiftId, Status, ClockIn, ClockOut) |
| `Shift` | Shift (StartTime, EndTime, Type, CinemaId) |
| `Payroll` | Payroll (StaffId, Period, TotalHours, Rate, TotalPay, Status) |
| `FaceEmbedding` | Face vector (encrypted 128-float vector) |

### Enums
| Enum | Values |
|---|---|
| `ShiftType` | FullTime (8h), PartTime (4h), Rotating |
| `RegistrationStatus` | Pending, Approved, Rejected, Cancelled |
| `PayrollStatus` | Pending, Paid |

## Data Flow

### Shift Registration
```
Staff → /staff → GET available shifts → Select shift → POST register →
RegistrationStatus = Pending → Manager approves → Approved
```

### Clock In/Out
```
Staff → /staff → Click Clock-In → FaceRecognitionModal →
Camera capture → POST clock-in (with face vector) →
Backend auth face → Record clock-in time
```

### Face Recognition
```
Staff registers face → 128-float vector → Encrypted → Stored in DB →
On check-in → Camera capture → Generate vector → Compare with stored →
Cosine similarity > threshold → Authentication success
```
