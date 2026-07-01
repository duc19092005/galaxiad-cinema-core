# POS Касса — Cashier POS

> Продажа билетов на кассе для посетителей с распознаванием лиц и QR-сканированием.

## Обзор

Cashier POS позволяет кассирам:
1. Продавать билеты на кассе — выбор фильма, сеанса, мест для клиента
2. Распознавание лиц для входа в систему
3. QR-сканирование билетов
4. Поиск клиента по email
5. Блокировка мест в реальном времени через **WebSocket**

## Frontend

### Routes
| Маршрут | Компонент | Описание |
|---|---|---|
| `/cashier` | `CashierPage` | Дашборд кассира |
| `/cashier/sales` | `CashierSalesPage` | Продажа билетов |

### Ключевые компоненты
- **`CounterSaleForm`**: Форма продажи билетов на кассе
- **`CustomerLookupInput`**: Поиск клиента по email
- **`SeatSelectionPOS`**: Выбор мест (WebSocket через `useSeatWs`)
- **`QRScanner`**: QR-сканер билетов
- **`FaceRecognitionCheckIn`**: Вход по лицу
- **`PaymentPOS`**: Обработка оплаты на кассе

## Backend

Использует API модуля Booking.

### API Endpoints
| Метод | Endpoint | Описание |
|---|---|---|
| POST | `api/v1/booking/create` | Создать заказ (касса) |
| POST | `api/v1/booking/seats/lock` | Заблокировать места (WebSocket) |
| GET | `api/v1/customer/lookup-by-email` | Поиск клиента |
| WS | `api/v1/booking/seats/ws/{scheduleId}` | WebSocket статус мест |

### Переиспользуемые Use Cases
- `CreateBookingUseCase`
- `BookingSeatSelectionPolicy`

## Описание потока данных

### Продажа на кассе
```
Кассир входит → /cashier/sales → Выбор фильма и сеанса →
Поиск клиента по email (опционально) → Выбор мест (WebSocket блокировка) →
Подтверждение оплаты → POST create → Печать билета / QR
```
