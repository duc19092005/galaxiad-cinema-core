# Portal nhân viên — Staff Portal

> Module tự phục vụ cho nhân viên: đăng ký ca, chấm công, xem lịch sử và lương.

## Tổng quan

Staff Portal cho phép nhân viên:
1. Xem và đăng ký ca làm trống
2. Check-in/Check-out với nhận diện khuôn mặt
3. Xem lịch sử làm việc
4. Xem thông tin lương

## Frontend

### Routes
| Route | Component | Mô tả |
|---|---|---|
| `/staff` | `StaffPage` | Dashboard nhân viên |
| `/staff/:tab` | `StaffPage` | Tab cụ thể (shifts, history, payroll) |

### Components chính
- **`AvailableShiftsTable`**: Bảng ca làm trống có thể đăng ký
- **`MyShiftRegistrations`**: Danh sách ca đã đăng ký
- **`ClockInButton`**: Nút check-in (với face recognition)
- **`ClockOutButton`**: Nút check-out
- **`WorkingHistoryTable`**: Bảng lịch sử làm việc
- **`PayrollInfoCard`**: Thông tin lương
- **`FaceRecognitionModal`**: Modal nhận diện khuôn mặt để check-in/out

## Backend

### API Endpoints
| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `api/Staff/Shifts/available` | Danh sách ca trống |
| POST | `api/Staff/Shifts/register` | Đăng ký ca làm |
| GET | `api/Staff/Shifts/my-registrations` | Ca đã đăng ký |
| POST | `api/Staff/Shifts/clock-in` | Check-in (có face recognition) |
| POST | `api/Staff/Shifts/clock-out` | Check-out |
| GET | `api/Staff/Shifts/my-history` | Lịch sử làm việc |
| GET | `api/Staff/Shifts/my-payroll` | Thông tin lương |

### Use Cases
| Use Case | Mô tả |
|---|---|
| `GetAvailableShiftsUseCase` | Lấy danh sách ca trống |
| `RegisterShiftUseCase` | Đăng ký ca làm |
| `GetMyRegistrationsUseCase` | Lấy danh sách ca đã đăng ký |
| `ClockInUseCase` | Check-in (xác thực face) |
| `ClockOutUseCase` | Check-out |
| `GetMyHistoryUseCase` | Lịch sử làm việc |
| `GetMyPayrollUseCase` | Thông tin lương |

### Domain Entities
| Entity | Mô tả |
|---|---|
| `ShiftRegistration` | Đăng ký ca làm (StaffId, ShiftId, Status, ClockIn, ClockOut) |
| `Shift` | Ca làm (StartTime, EndTime, Type, CinemaId) |
| `Payroll` | Bảng lương (StaffId, Period, TotalHours, Rate, TotalPay, Status) |
| `FaceEmbedding` | Vector khuôn mặt (encrypted 128-float vector) |

### Enums
| Enum | Values |
|---|---|
| `ShiftType` | FullTime (8h), PartTime (4h), Rotating |
| `RegistrationStatus` | Pending, Approved, Rejected, Cancelled |
| `PayrollStatus` | Pending, Paid |

## Luồng xử lý

### Đăng ký ca
```
Staff → /staff → GET available shifts → Chọn ca → POST register →
RegistrationStatus = Pending → Manager phê duyệt → Approved
```

### Check-in/out
```
Staff → /staff → Click Clock-In → FaceRecognitionModal →
Camera capture → POST clock-in (kèm face vector) →
Backend xác thực face → Ghi nhận clock-in time
```

### Face Recognition
```
Staff đăng ký face → 128-float vector → Mã hóa → Lưu DB →
Khi check-in → Camera capture → Tạo vector → So sánh với vector đã lưu →
Cosine similarity > threshold → Xác thực thành công
```
