# Đặt vé cá nhân — Booking

> Module đặt vé cá nhân với chọn ghế real-time và thanh toán VNPay.

## Tổng quan

Module cho phép khách hàng:
1. Xem lịch chiếu và chọn suất chiếu
2. Chọn ghế ngồi với locking real-time qua **WebSocket**
3. Thanh toán qua cổng VNPay
4. Tải vé PDF sau khi thanh toán thành công
5. Xem lịch sử đặt vé

> [!IMPORTANT]
> **Real-time Communication**: Module booking sử dụng **WebSocket** (không phải SSE) cho cả seat locking và payment status.

## Frontend

### Routes
| Route | Component | Mô tả |
|---|---|---|
| `/booking/:scheduleId` | `BookingPage` | Trang chọn ghế và đặt vé |
| `/booking/success` | `BookingSuccessPage` | Xác nhận đặt vé thành công |
| `/booking/failed` | `BookingFailedPage` | Thông báo đặt vé thất bại |
| `/showtimes` | `ShowtimesPage` | Danh sách suất chiếu |
| `/theaters` | `TheatersPage` | Danh sách rạp |
| `/offers` | `OffersPage` | Khuyến mãi hiện có |
| `/account` | `AccountPage` | Tài khoản & lịch sử vé |

### Components chính
- **`SeatGrid`**: Grid hiển thị sơ đồ ghế, tự động cập nhật trạng thái qua WebSocket
- **`SeatLegend`**: Chú thích trạng thái ghế (trống/đang giữ/đã bán)
- **`BookingSummary`**: Tóm tắt đơn hàng (số ghế, giá, tổng tiền)
- **`PaymentButton`**: Nút thanh toán VNPay
- **`VnPayReturnHandler`**: Xử lý callback từ VNPay
- **`BookingHistoryTable`**: Bảng lịch sử đặt vé
- **`TicketDownloadButton`**: Nút tải vé PDF

### Custom Hooks
- **`useSeatWs`**: WebSocket hook cho seat locking (`seats/ws/{scheduleId}`)
- **`usePaymentWs`**: WebSocket hook cho payment status (`payment/ws/{orderId}`)
- **`useBooking`**: Hook quản lý state quá trình booking

## Backend

### API Endpoints
| Method | Endpoint | Chức năng |
|---|---|---|
| POST | `api/v1/booking/create` | Tạo đơn hàng mới |
| POST | `api/v1/booking/seats/lock` | Khóa ghế đã chọn |
| POST | `api/v1/booking/seats/unlock` | Mở khóa ghế |
| GET | `api/v1/booking/ticket/{orderId}` | Lấy thông tin vé |
| GET | `api/v1/booking/vnpay-callback` | Callback từ VNPay |
| WS | `api/v1/booking/payment/ws/{orderId}` | WebSocket cập nhật trạng thái thanh toán |
| WS | `api/v1/booking/seats/ws/{scheduleId}` | WebSocket cập nhật trạng thái ghế |
| GET | `api/v1/booking/history` | Lịch sử đặt vé của user |
| GET | `api/v1/booking/account` | Thông tin tài khoản |

### Use Cases
| Use Case | Mô tả |
|---|---|
| `CreateBookingUseCase` | Tạo đơn hàng và xử lý thanh toán |
| `ProcessVnPayCallbackUseCase` | Xử lý callback từ VNPay |
| `GetUserBookingHistoryUseCase` | Lịch sử đặt vé |
| `GetUserAccountInfoUseCase` | Thông tin tài khoản |

### Domain Entities
| Entity | Mô tả |
|---|---|
| `Order` | Đơn hàng (CustomerId, ScheduleId, Seats, TotalPrice, Status, CreatedAt) |
| `OrderItem` | Chi tiết đơn hàng (SeatId, Price) |
| `Payment` | Giao dịch thanh toán (OrderId, Amount, Method, Status, TransactionId) |
| `SeatLock` | Khóa ghế tạm thời (SeatId, ScheduleId, SessionId, LockedAt, ExpiresAt) |
| `Ticket` | Vé điện tử (Code, OrderId, SeatId, QRData) |

### Enums
| Enum | Values |
|---|---|
| `OrderStatus` | Pending, Booked, Canceled, Refunded, Completed |
| `PaymentStatus` | Pending, Success, Failed, Refunded |
| `SeatStatus` | Available, Locked, Booked |

## Luồng xử lý

### Đặt vé
```
User → Chọn suất chiếu → /booking/:scheduleId → Seat grid hiện qua WebSocket →
Chọn ghế → POST seats/lock → WebSocket broadcast → Thanh toán VNPay →
User chuyển đến VNPay → VNPay callback → Backend xác nhận →
WebSocket payment success → Hiển thị vé thành công → Tải PDF
```

### WebSocket Seat Locking
```
Client kết nối → seats/ws/{scheduleId} → Server gửi trạng thái ghế real-time →
User chọn ghế → POST seats/lock → Server broadcast cập nhật → 
Tất cả client nhận trạng thái mới → Hết 10 phút → Auto unlock nếu chưa thanh toán
```

### Xử lý hết hạn
- **10 phút**: Seats locked tự động release sau 10 phút nếu không thanh toán
- **Hangfire job**: Chạy mỗi 5 phút, cancel orders Pending quá 10 phút
- **WebSocket disconnect**: Khi client mất kết nối WebSocket, seats locked bởi session đó được release

## Ghi chú

> [!NOTE]
> - Giá vé luôn được tính ở backend, không tin giá từ browser
> - Sau thanh toán thành công, áp dụng pricing snapshot để lưu giá tham chiếu
> - Hủy vé được phép trước giờ chiếu 2 tiếng (có thể mất phí hủy)
