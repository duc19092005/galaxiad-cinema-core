# Индивидуальное бронирование — Booking

> Бронирование билетов с выбором мест в реальном времени (WebSocket) и оплатой VNPay.

## Обзор

Позволяет клиентам:
1. Просматривать сеансы и выбирать расписание
2. Выбирать места с блокировкой в реальном времени через **WebSocket**
3. Оплачивать через VNPay
4. Скачивать PDF билет после оплаты
5. Просматривать историю бронирований

> [!IMPORTANT]
> Использует **WebSocket** (НЕ SSE) для блокировки мест и статуса оплаты.

## Frontend

### Routes
| Маршрут | Компонент | Описание |
|---|---|---|
| `/booking/:scheduleId` | `BookingPage` | Страница выбора мест |
| `/booking/success` | `BookingSuccessPage` | Подтверждение бронирования |
| `/booking/failed` | `BookingFailedPage` | Ошибка бронирования |
| `/showtimes` | `ShowtimesPage` | Список сеансов |
| `/theaters` | `TheatersPage` | Список кинотеатров |
| `/offers` | `OffersPage` | Актуальные акции |
| `/account` | `AccountPage` | Аккаунт и история |

### Custom Hooks
- **`useSeatWs`**: WebSocket для блокировки мест (`seats/ws/{scheduleId}`)
- **`usePaymentWs`**: WebSocket для статуса оплаты (`payment/ws/{orderId}`)

## Backend

### API Endpoints
| Метод | Endpoint | Описание |
|---|---|---|
| POST | `api/v1/booking/create` | Создать заказ |
| POST | `api/v1/booking/seats/lock` | Заблокировать места |
| POST | `api/v1/booking/seats/unlock` | Разблокировать места |
| GET | `api/v1/booking/ticket/{orderId}` | Информация о билете |
| GET | `api/v1/booking/vnpay-callback` | Callback VNPay |
| WS | `api/v1/booking/payment/ws/{orderId}` | WebSocket статус оплаты |
| WS | `api/v1/booking/seats/ws/{scheduleId}` | WebSocket статус мест |
| GET | `api/v1/booking/history` | История бронирований |
| GET | `api/v1/booking/account` | Информация об аккаунте |

### Use Cases
| Use Case | Описание |
|---|---|
| `CreateBookingUseCase` | Создать заказ и обработать оплату |
| `ProcessVnPayCallbackUseCase` | Обработать callback VNPay |
| `GetUserBookingHistoryUseCase` | История бронирований пользователя |
| `GetUserAccountInfoUseCase` | Информация об аккаунте |

### Domain Entities
| Сущность | Описание |
|---|---|
| `Order` | Заказ (CustomerId, ScheduleId, Seats, TotalPrice, Status) |
| `Payment` | Платёж (OrderId, Amount, Method, Status) |
| `SeatLock` | Временная блокировка места (SeatId, ScheduleId, SessionId, ExpiresAt) |
| `Ticket` | Электронный билет (Code, OrderId, SeatId, QRData) |

### Enums
| Enum | Значения |
|---|---|
| `OrderStatus` | Pending, Booked, Canceled, Refunded, Completed |
| `PaymentStatus` | Pending, Success, Failed, Refunded |
| `SeatStatus` | Available, Locked, Booked |

## Описание потока данных

### Бронирование
```
Пользователь → Выбор сеанса → /booking/:scheduleId → Сетка мест через WebSocket →
Выбор мест → POST seats/lock → WebSocket broadcast → Оплата VNPay →
Редирект на VNPay → Callback VNPay → Backend подтверждает →
WebSocket payment success → Показ билета → Скачивание PDF
```

### Тайм-ауты
- **10 мин**: Заблокированные места авто-освобождаются
- **Hangfire job**: Каждые 5 мин отменяет Pending заказы > 10 мин
- **Отключение WebSocket**: Места, заблокированные отключённой сессией, освобождаются
