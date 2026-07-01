# Bán vé tại quầy — Cashier POS

> Module bán vé cho khách hàng mua trực tiếp tại quầy vé.

## Tổng quan

Cashier POS cho phép nhân viên thu ngân (Cashier):
1. Bán vé tại quầy — chọn phim, suất chiếu, ghế cho khách
2. Nhận diện khuôn mặt để check-in
3. Quét QR code vé
4. Tra cứu khách hàng qua email
5. Khóa ghế real-time qua **WebSocket**

## Frontend

### Routes
| Route | Component | Mô tả |
|---|---|---|
| `/cashier` | `CashierPage` | Dashboard thu ngân |
| `/cashier/sales` | `CashierSalesPage` | Bán vé tại quầy |

### Components chính
- **`CounterSaleForm`**: Form bán vé tại quầy
- **`CustomerLookupInput`**: Tra cứu khách hàng bằng email
- **`SeatSelectionPOS`**: Chọn ghế (dùng WebSocket hook `useSeatWs`)
- **`QRScanner`**: Quét mã QR vé
- **`FaceRecognitionCheckIn`**: Check-in bằng nhận diện khuôn mặt
- **`PaymentPOS`**: Xử lý thanh toán tại quầy

## Backend

Module Cashier tái sử dụng hầu hết các API từ module Booking.

### API Endpoints
| Method | Endpoint | Chức năng |
|---|---|---|
| POST | `api/v1/booking/create` | Tạo đơn hàng (tại quầy) |
| POST | `api/v1/booking/seats/lock` | Khóa ghế (qua WebSocket) |
| GET | `api/v1/customer/lookup-by-email` | Tra cứu khách hàng |
| WS | `api/v1/booking/seats/ws/{scheduleId}` | WebSocket trạng thái ghế |

### Use Cases
Tái sử dụng từ Booking:
- `CreateBookingUseCase`
- `BookingSeatSelectionPolicy`
- `BookingPricingService`

## Luồng xử lý

### Bán vé tại quầy
```
Cashier đăng nhập → /cashier/sales → Chọn phim & suất chiếu →
Nhập email khách hàng (optional) → Chọn ghế (WebSocket lock) →
Xác nhận thanh toán → POST create → In vé / QR code
```
