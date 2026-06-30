# Seat Locking Architecture — Quyết định Thiết kế

> **Tình trạng tài liệu:** Hoàn thành (V1)
> **Cập nhật lần cuối:** 2026-06-30

---

## 1. Vấn đề

Chúng tôi cần một **cơ chế khóa ghế real-time** trong luồng đặt vé. Khi khách hàng chọn ghế và bắt đầu thanh toán, những ghế đó phải được giữ tạm thời để người khác không chọn được. Cơ chế phải:

1. **Khóa ngay lập tức** — người dùng khác thấy ghế đã có người chọn ngay
2. **Tự động giải phóng** — ghế tự mở khóa nếu không thanh toán kịp
3. **Xử lý mất kết nối** — đóng tab trình duyệt → ghế được release
4. **Đơn giản để bảo trì** — tránh over-engineering cho lock tạm thời

---

## 2. Các phương án

### Phương án A: SSE + HTTP POST ✅ (Đã chọn)

- **Server → Client:** SSE (Server-Sent Events) — API có sẵn trong trình duyệt, push một chiều
- **Client → Server:** HTTP POST — REST API tiêu chuẩn
- **Lưu trữ:** In-memory (ConcurrentDictionary trong Singleton)

### Phương án B: SignalR (WebSocket)

- Kênh giao tiếp hai chiều
- Cần đàm phán WebSocket với fallback transports
- Cần Redis backplane để scale nhiều instance

### Phương án C: Polling (setInterval)

- Frontend gọi server mỗi X giây để hỏi trạng thái
- Đơn giản nhưng tốn tài nguyên (gọi liên tục)
- Chậm (không real-time)

### Phương án D: Khóa trên Database

- Trạng thái lock lưu trong SQL Server
- Tin cậy nhất nhưng chậm nhất (tốn DB round-trip)
- Nguy cơ cạn kiệt connection pool

---

## 3. Quyết định: SSE + HTTP POST

### Tại sao chọn phương án này

| Tiêu chí | SSE + POST | SignalR | Polling | DB Lock |
|---------|-----------|---------|---------|---------|
| Real-time | ✅ Tức thì | ✅ Tức thì | ❌ Chậm | ❌ Chậm |
| Độ phức tạp | ✅ Thấp | ❌ Cao | ✅ Thấp | ❌ Trung bình |
| Tự động reconnect | ✅ Có sẵn | ⚠️ Tự code | ✅ Tự nhiên | N/A |
| CDN friendly | ✅ Có | ⚠️ Một phần | ✅ Có | ✅ Có |
| Lưu trữ state | ⚠️ RAM | ⚠️ RAM | ⚠️ DB/Redis | ✅ Tin cậy |
| Chi phí bảo trì | ✅ Rất thấp | ❌ Cao | ✅ Thấp | ❌ Trung bình |
| **Tổng quan** | **✅ Tốt nhất** | ❌ | ⚠️ | ❌ |

### Trade-offs đã chấp nhận

| Trade-off | Tại sao chấp nhận được |
|-----------|----------------------|
| **Lưu trong RAM** (mất khi restart) | Lock tạm thời (tối đa 10 phút). Client tự động reconnect và nhận state mới. |
| **SSE một chiều** | Cố ý — lock/unlock là REST action riêng, có HTTP response ngay (200/409). |
| **Không dùng Redis** | V1 single server. Khi cần scale sẽ thêm Redis pub/sub. |

---

## 4. Kiến trúc tổng quan

### Các thành phần cốt lõi

```
┌──────────────────────────────────────────────────────┐
│                    SeatSseManager                      │
│                  (Singleton Service)                    │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  _scheduleSeatLocks                              │  │
│  │  ConcurrentDictionary<scheduleId,                │  │
│  │    ConcurrentDictionary<seatId, (userName, clientId)>> │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  _scheduleSubscribers                           │  │
│  │  ConcurrentDictionary<scheduleId,                │  │
│  │    ConcurrentDictionary<subscriberId, callback>> │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  _scheduleEventCounters                         │  │
│  │  ConcurrentDictionary<scheduleId, int>           │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### An toàn luồng (Thread Safety)

Tất cả cấu trúc dữ liệu dùng `ConcurrentDictionary` — an toàn luồng mặc định. Phương thức `LockSeat()` dùng `TryAdd` nguyên tử để ngăn race condition khi hai người cùng khóa một ghế.

### Luồng dữ liệu

```
POST /seats/lock  ──►  LockSeat() ──►  TryAdd vào dictionary
                        │
                        ├─► Thành công? ──► BroadcastEvent("seat-locked")
                        │                       │
                        │                  SSE subscribers nhận cập nhật
                        │
                        └─► Thất bại? ──► Trả về 409 Conflict

SSE ngắt kết nối ──►  ReleaseSeatsByClient()
                        │
                        └─► Mỗi ghế của client đó:
                              TryRemove → BroadcastEvent("seat-unlocked")

Hangfire job ────►  ReleaseSeatsForSchedule()
                        │
                        └─► Mỗi seatId:
                              TryRemove → BroadcastEvent("seat-unlocked")
```

---

## 5. Chi tiết giao thức SSE

### Định dạng sự kiện

```
id: {eventId}
event: {eventType}
data: {jsonPayload}

```

### Các loại sự kiện

| Event | Khi nào | Payload |
|-------|---------|---------|
| `initial-state` | Có subscriber mới | `{ "lockedSeats": { "A1": "UserA" } }` |
| `seat-locked` | Có người khóa ghế | `{ "seatId": "A1", "userName": "UserA", "lockedSeats": {...} }` |
| `seat-unlocked` | Có người mở khóa ghế | `{ "seatId": "A1", "lockedSeats": {...} }` |

### Heartbeat

Một dòng comment (`: heartbeat\n\n`) được gửi mỗi 15 giây để ngăn proxy/load balancer đóng kết nối.

### Kết nối lại

`EventSource` (có sẵn trong trình duyệt) tự động xử lý reconnect. Ở V1, mỗi lần kết nối lại, client nhận toàn bộ `lockedSeats` snapshot qua `initial-state`.

---

## 6. Hạn chế V1

| Hạn chế | Ảnh hưởng | Cải thiện sau này |
|---------|-----------|------------------|
| **Không Redis backplane** | Multi-instance bị phân mảnh state | Thêm Redis pub/sub |
| **Không expiry từng lock** | Lock tồn tại trong RAM nếu client mất kết nối đột ngột | Thêm background job quét lock hết hạn |
| **Không persistent state** | Mất lock khi restart | Chấp nhận được (lock tối đa 10 phút) |
| **Bộ nhớ đơn máy** | RAM tăng theo số schedule đang hoạt động | Giám sát và đặt giới hạn |

---

## 7. So sánh chi tiết: SSE vs SignalR

| Khía cạnh | SSE | SignalR |
|-----------|-----|---------|
| Transport | HTTP native (long-poll hoặc stream) | WebSocket + fallback (SSE, long-polling) |
| Hỗ trợ trình duyệt | Tất cả trình duyệt hiện đại | Cần thư viện `@microsoft/signalr` |
| Tự động reconnect | Có sẵn (`EventSource`) | Có thể cấu hình |
| Kết nối tối đa (trình duyệt) | 6 mỗi domain (HTTP/1.1) | Không giới hạn (WebSocket) |
| Dữ liệu nhị phân | Không (text) | Có |
| Custom headers | Không (qua URL params) | Có (qua negotiate) |
| Qua proxy | Hoạt động qua HTTP proxy | Một số proxy chặn WebSocket |
| CDN caching | Hoạt động | WebSocket upgrade thất bại |
| Phức tạp giao thức | Đơn giản (text/event-stream) | Phức tạp (negotiation, hub protocol) |
| Thư viện client | Không cần (trình duyệt có sẵn) | npm package `@microsoft/signalr` |

---

## 8. Các file liên quan

| File | Đường dẫn |
|------|----------|
| `SeatSseManager` | `apps/backend/Cinema.Infrastructure/ExternalServices/Notifications/SeatSseManager.cs` |
| `BookingController` (lock/unlock/events) | `apps/backend/Cinema.Api/Controllers/Customer/Booking/BookingController.cs` |
| `SeatLockerNotificationService` | `apps/backend/Cinema.Api/Hubs/SeatLockerNotificationService.cs` |
| `PendingOrderCancellationJob` | `apps/backend/Cinema.Infrastructure/BackgroundJobs/Bookings/PendingOrderCancellationJob.cs` |
| `ISeatLockerNotificationService` | `apps/backend/Cinema.Application/Interfaces/Booking/ISeatLockerNotificationService.cs` |
| `useSeatSse` hook | `apps/frontend/src/hooks/useSeatSse.ts` |
| `bookingApi.ts` (lock/unlock client) | `apps/frontend/src/api/bookingApi.ts` |
