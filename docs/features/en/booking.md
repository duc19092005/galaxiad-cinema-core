# Individual Ticket Booking — Booking

> Individual ticket booking with real-time seat selection (WebSocket) and VNPay payment.

## Overview

Allows customers to:
1. Browse showtimes and select a schedule
2. Select seats with real-time locking via **WebSocket**
3. Pay through VNPay gateway
4. Download PDF ticket after successful payment
5. View booking history

> [!IMPORTANT]
> **Real-time Communication**: Uses **WebSocket** (NOT SSE) for both seat locking and payment status.

## Frontend

### Routes
| Route | Component | Description |
|---|---|---|
| `/booking/:scheduleId` | `BookingPage` | Seat selection & booking page |
| `/booking/success` | `BookingSuccessPage` | Booking confirmation |
| `/booking/failed` | `BookingFailedPage` | Booking failure notice |
| `/showtimes` | `ShowtimesPage` | Showtime list |
| `/theaters` | `TheatersPage` | Cinema list |
| `/offers` | `OffersPage` | Current promotions |
| `/account` | `AccountPage` | Account & booking history |

### Custom Hooks
- **`useSeatWs`**: WebSocket hook for seat locking (`seats/ws/{scheduleId}`)
- **`usePaymentWs`**: WebSocket hook for payment status (`payment/ws/{orderId}`)
- **`useBooking`**: Booking state management hook

## Backend

### API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | `api/v1/booking/create` | Create order |
| POST | `api/v1/booking/seats/lock` | Lock selected seats |
| POST | `api/v1/booking/seats/unlock` | Unlock seats |
| GET | `api/v1/booking/ticket/{orderId}` | Get ticket info |
| GET | `api/v1/booking/vnpay-callback` | VNPay callback |
| WS | `api/v1/booking/payment/ws/{orderId}` | WebSocket payment status |
| WS | `api/v1/booking/seats/ws/{scheduleId}` | WebSocket seat status |
| GET | `api/v1/booking/history` | User booking history |
| GET | `api/v1/booking/account` | Account info |

### Use Cases
| Use Case | Description |
|---|---|
| `CreateBookingUseCase` | Create order and process payment |
| `ProcessVnPayCallbackUseCase` | Handle VNPay callback |
| `GetUserBookingHistoryUseCase` | Get user's booking history |
| `GetUserAccountInfoUseCase` | Get user account info |

### Domain Entities
| Entity | Description |
|---|---|
| `Order` | Order (CustomerId, ScheduleId, Seats, TotalPrice, Status) |
| `OrderItem` | Order item (SeatId, Price) |
| `Payment` | Payment transaction (OrderId, Amount, Method, Status) |
| `SeatLock` | Temporary seat lock (SeatId, ScheduleId, SessionId, ExpiresAt) |
| `Ticket` | Electronic ticket (Code, OrderId, SeatId, QRData) |

### Enums
| Enum | Values |
|---|---|
| `OrderStatus` | Pending, Booked, Canceled, Refunded, Completed |
| `PaymentStatus` | Pending, Success, Failed, Refunded |
| `SeatStatus` | Available, Locked, Booked |

## Data Flow

### Booking Flow
```
User → Select showtime → /booking/:scheduleId → Seat grid via WebSocket →
Select seats → POST seats/lock → WebSocket broadcast → VNPay payment →
User redirected to VNPay → VNPay callback → Backend confirms →
WebSocket payment success → Show ticket → Download PDF
```

### WebSocket Seat Locking
```
Client connects → seats/ws/{scheduleId} → Server sends real-time seat status →
User selects seats → POST seats/lock → Server broadcasts update →
All clients see new status → 10 min timeout → Auto unlock if unpaid
```

### Timeout Handling
- **10 min**: Locked seats auto-release if payment incomplete
- **Hangfire job**: Runs every 5 min, cancels Pending orders > 10 min
- **WebSocket disconnect**: Seats locked by disconnected session are released
