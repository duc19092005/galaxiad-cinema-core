# Point of Sale System — Cashier POS

> Counter ticket sales for walk-in customers with face recognition and QR scanning.

## Overview

Cashier POS allows cashier staff to:
1. Sell tickets at the counter — select movie, showtime, seats for customer
2. Face recognition staff check-in
3. QR code ticket scanning
4. Customer lookup by email
5. Real-time seat locking via **WebSocket**

## Frontend

### Routes
| Route | Component | Description |
|---|---|---|
| `/cashier` | `CashierPage` | Cashier dashboard |
| `/cashier/sales` | `CashierSalesPage` | Counter sales |

### Key Components
- **`CounterSaleForm`**: Counter ticket sales form
- **`CustomerLookupInput`**: Customer lookup by email
- **`SeatSelectionPOS`**: Seat selection (WebSocket via `useSeatWs`)
- **`QRScanner`**: QR ticket scanner
- **`FaceRecognitionCheckIn`**: Face recognition check-in
- **`PaymentPOS`**: Counter payment processing

## Backend

Reuses most APIs from the Booking module.

### API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | `api/v1/booking/create` | Create order (counter) |
| POST | `api/v1/booking/seats/lock` | Lock seats (WebSocket) |
| GET | `api/v1/customer/lookup-by-email` | Customer lookup |
| WS | `api/v1/booking/seats/ws/{scheduleId}` | WebSocket seat status |

### Reused Use Cases
- `CreateBookingUseCase`
- `BookingSeatSelectionPolicy`
- `BookingPricingService`

## Data Flow

### Counter Sale
```
Cashier logs in → /cashier/sales → Select movie & showtime →
Enter customer email (optional) → Select seats (WebSocket lock) →
Confirm payment → POST create → Print ticket / QR code
```
