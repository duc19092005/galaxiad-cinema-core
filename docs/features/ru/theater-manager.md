# Управление театром — Theater Management

> Расписание, AI-рекомендации сеансов, шаблоны смен, профили сотрудников и зарплата.

## Обзор

Theater Manager охватывает 3 области:
1. **Расписание сеансов** — CRUD, AI-рекомендации
2. **Смены** — Шаблоны, регистрация, утверждение
3. **Сотрудники и зарплата** — Профили, расчёт зарплаты

## Frontend

### Routes
| Маршрут | Компонент | Описание |
|---|---|---|
| `/theater-manager` | `TheaterManagerPage` | Дашборд управления театром |
| `/theater-manager/:tab` | `TheaterManagerPage` | Вкладка |
| `/schedule` | `SchedulePage` | Просмотр расписания |

### Ключевые компоненты
- **`ScheduleCalendar`**: Календарь/таймлайн расписания
- **`ScheduleFormModal`**: Модал добавления/редактирования
- **`AIRecommendationPanel`**: Панель AI-рекомендаций
- **`RecommendationPreview`**: Превью перед применением
- **`ShiftTemplateTable`**: Шаблоны смен
- **`ShiftTemplateFormModal`**: Модал шаблона
- **`ShiftRegistrationTable`**: Регистрации ожидающие утверждения
- **`ShiftApprovalButton`**: Кнопки утверждения/отклонения
- **`StaffProfileCard`**: Карточка профиля сотрудника
- **`PayrollTable`**: Таблица зарплаты
- **`PayrollCalculateButton`**: Кнопка расчёта зарплаты

## Backend

### API Endpoints
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `api/TheaterManager/MovieSchedules` | Список сеансов |
| POST | `api/TheaterManager/MovieSchedules` | Создать сеанс |
| PUT | `api/TheaterManager/MovieSchedules/{id}` | Обновить |
| DELETE | `api/TheaterManager/MovieSchedules/{id}` | Удалить |
| GET | `api/TheaterManager/MovieScheduleRecommendations/generate` | AI-рекомендации |
| GET | `api/TheaterManager/MovieScheduleRecommendations/preview` | Превью |
| POST | `api/TheaterManager/MovieScheduleRecommendations/apply` | Применить |
| POST | `api/TheaterManager/MovieScheduleRecommendations/dismiss` | Отклонить |
| GET | `api/TheaterManager/Shifts/templates` | Шаблоны смен |
| POST | `api/TheaterManager/Shifts/templates` | Создать шаблон |
| PUT | `api/TheaterManager/Shifts/templates/{id}` | Обновить шаблон |
| GET | `api/TheaterManager/Shifts/registrations` | Регистрации |
| POST | `api/TheaterManager/Shifts/approve` | Утвердить |
| POST | `api/TheaterManager/Shifts/reject` | Отклонить |
| GET | `api/TheaterManager/Shifts/staff-profiles` | Профили сотрудников |
| POST | `api/TheaterManager/Shifts/staff-profiles` | Создать профиль |
| PUT | `api/TheaterManager/Shifts/staff-profiles/{id}` | Обновить профиль |
| GET | `api/TheaterManager/Shifts/payroll` | Зарплата |
| POST | `api/TheaterManager/Shifts/payroll/calculate` | Рассчитать |
| POST | `api/TheaterManager/Shifts/payroll/pay` | Выплатить |

### Domain Entities
| Сущность | Описание |
|---|---|
| `MovieSchedule` | Сеанс (MovieId, AuditoriumId, Format, StartTime, EndTime) |
| `ScheduleRecommendation` | AI-рекомендация (MovieId, AuditoriumId, Score, Status) |
| `ShiftTemplate` | Шаблон смены (Name, StartTime, EndTime, Type) |
| `ShiftRegistration` | Регистрация (StaffId, ShiftId, Status) |
| `StaffProfile` | Профиль сотрудника (Name, Role, HourlyRate, Type) |
| `Payroll` | Зарплата (StaffId, Period, Amount, Status) |

### Enums
| Enum | Значения |
|---|---|
| `RecommendationStatus` | Pending, Previewed, Applied, Dismissed, Failed |
| `ShiftType` | FullTime, PartTime, Rotating |
| `RegistrationStatus` | Pending, Approved, Rejected, Cancelled |
| `StaffType` | FullTime, PartTime |
| `PayrollStatus` | Pending, Paid |

## Описание потока данных

### AI-рекомендации сеансов
```
Менеджер → "Generate AI Recommendations" → GET generate →
Backend оценка (детерминированные правила):
  1. Тренды оплаченных билетов и выручка
  2. Сигналы просмотров/поиска
  3. Оценки и комментарии
  4. Свежесть фильма
  5. Вместимость зала и поддержка форматов
  6. Прайм-тайм окна
→ Список рекомендаций → Превью → Применить (перепроверка) → Сохранение аудита
```

### Создание сеанса
```
Менеджер → Schedule tab → Календарь → Выбор даты →
Просмотр расписания → Добавить/Редактировать → POST/PUT →
Backend проверяет:
  - Совместимость формата
  - 15 мин интервал уборки
  - Нет пересечений
  - Не в прошлом
  - Часы работы (06:00 - 02:00)
```
