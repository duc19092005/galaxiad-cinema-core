# Портал сотрудника — Staff Portal

> Самообслуживание для сотрудников: регистрация смен, чек-ин/аут, история и зарплата.

## Обзор

Позволяет сотрудникам:
1. Просматривать и регистрироваться на свободные смены
2. Чек-ин/аут с распознаванием лиц
3. Просматривать историю работы
4. Просматривать информацию о зарплате

## Frontend

### Routes
| Маршрут | Компонент | Описание |
|---|---|---|
| `/staff` | `StaffPage` | Дашборд сотрудника |
| `/staff/:tab` | `StaffPage` | Вкладка (shifts, history, payroll) |

### Ключевые компоненты
- **`AvailableShiftsTable`**: Таблица доступных смен
- **`MyShiftRegistrations`**: Зарегистрированные смены
- **`ClockInButton`**: Кнопка чек-ин (с распознаванием лиц)
- **`ClockOutButton`**: Кнопка чек-аут
- **`WorkingHistoryTable`**: История работы
- **`PayrollInfoCard`**: Информация о зарплате
- **`FaceRecognitionModal`**: Модал распознавания лиц

## Backend

### API Endpoints
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `api/Staff/Shifts/available` | Доступные смены |
| POST | `api/Staff/Shifts/register` | Зарегистрироваться на смену |
| GET | `api/Staff/Shifts/my-registrations` | Мои регистрации |
| POST | `api/Staff/Shifts/clock-in` | Чек-ин (с лицом) |
| POST | `api/Staff/Shifts/clock-out` | Чек-аут |
| GET | `api/Staff/Shifts/my-history` | История работы |
| GET | `api/Staff/Shifts/my-payroll` | Информация о зарплате |

### Use Cases
| Use Case | Описание |
|---|---|
| `GetAvailableShiftsUseCase` | Список доступных смен |
| `RegisterShiftUseCase` | Регистрация на смену |
| `GetMyRegistrationsUseCase` | Мои регистрации |
| `ClockInUseCase` | Чек-ин (с лицом) |
| `ClockOutUseCase` | Чек-аут |
| `GetMyHistoryUseCase` | История работы |
| `GetMyPayrollUseCase` | Зарплата |

### Domain Entities
| Сущность | Описание |
|---|---|
| `ShiftRegistration` | Регистрация смены (StaffId, ShiftId, Status, ClockIn, ClockOut) |
| `Shift` | Смена (StartTime, EndTime, Type, CinemaId) |
| `Payroll` | Зарплата (StaffId, Period, TotalHours, Rate, TotalPay, Status) |
| `FaceEmbedding` | Вектор лица (зашифрованный 128-float вектор) |

### Enums
| Enum | Значения |
|---|---|
| `ShiftType` | FullTime (8ч), PartTime (4ч), Rotating |
| `RegistrationStatus` | Pending, Approved, Rejected, Cancelled |
| `PayrollStatus` | Pending, Paid |

## Описание потока данных

### Регистрация на смену
```
Сотрудник → /staff → GET available shifts → Выбор смены → POST register →
RegistrationStatus = Pending → Менеджер утверждает → Approved
```

### Чек-ин/аут
```
Сотрудник → /staff → Clock-In → FaceRecognitionModal →
Захват камеры → POST clock-in (с вектором лица) →
Backend проверяет лицо → Запись времени чек-ин
```
