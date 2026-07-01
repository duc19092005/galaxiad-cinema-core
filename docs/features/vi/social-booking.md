# 🎫 Social Booking — Đặt Vé Nhóm

> Tính năng cho phép người dùng tạo nhóm, mời bạn bè, cùng nhau chọn ghế, vote phim, và thanh toán vé theo nhóm.

---

## 📋 Mục Lục

- [Tổng Quan](#tổng-quan)
- [Luồng Hoạt Động](#luồng-hoạt-động)
- [Trạng Thái Nhóm](#trạng-thái-nhóm)
- [Các Tính Năng Chi Tiết](#các-tính-năng-chi-tiết)
- [API Endpoints](#api-endpoints)
- [WebSocket Events](#websocket-events)
- [Kiến Trúc Backend](#kiến-trúc-backend)
- [Frontend Components](#frontend-components)

---

## Tổng Quan

Social Booking là hệ thống đặt vé nhóm cho phép:
- **Tạo nhóm** và mời bạn bè qua link/QR code
- **Chọn ghế** theo thời gian thực (WebSocket)
- **Bình chọn phim** (voting system)
- **Ghép đôi** để thanh toán chung
- **Thanh toán** qua VNPay (cá nhân hoặc chủ nhóm trả hộ)
- **Chat nhóm** trong thời gian thực
- **Xử lý thanh toán thất bại** với cơ chế vote

### Route
```
/group-booking/:groupCode
```

---

## Luồng Hoạt Động

```
Tạo nhóm → Mời thành viên → Chọn ghế → Xác nhận
    ↓
Bình chọn phương thức thanh toán (60s countdown)
    ↓
┌─────────────────┬──────────────────┬─────────────────┐
│  Một người trả  │  Mỗi người trả  │  Ghép đôi trả   │
│  (HostPayAll)   │ (IndividualPay)  │   (PairPay)     │
└────────┬────────┴────────┬─────────┴────────┬────────┘
         ↓                  ↓                  ↓
    Thanh toán VNPay    Thanh toán VNPay   Thanh toán VNPay
         ↓                  ↓                  ↓
    Hoàn thành          Hoàn thành          Hoàn thành
```

---

## Trạng Thái Nhóm

### GroupBookingStatusEnum

| Trạng Thái | Mô Tả |
|---|---|
| `Open` | Phòng mới tạo, đang chờ thành viên |
| `SeatsSelected` | Đã có người chọn ghế |
| `Confirming` | Tất cả đã xác nhận ghế |
| `VotingPaymentMethod` | Đang vote phương thức thanh toán |
| `Pairing` | Đang ghép đôi (nếu chọn PairPay) |
| `PayingAll` | Chủ nhóm đang trả cho tất cả |
| `PayingIndividual` | Mỗi người tự trả |
| `PayingPair` | Các cặp đang trả |
| `PaymentFailed` | Thanh toán thất bại (toàn bộ) |
| `PaymentFailedPartial` | Một số thanh toán thất bại |
| `Completed` | Thanh toán thành công |
| `Cancelled` | Phòng bị hủy |

### GroupMemberStatusEnum

| Trạng Thái | Mô Tả |
|---|---|
| `Invited` | Đã mời |
| `Joined` | Đã tham gia |
| `SeatsSelected` | Đã chọn ghế |
| `Confirmed` | Đã xác nhận |
| `Paid` | Đã thanh toán |
| `PaymentFailed` | Thanh toán thất bại |
| `Covered` | Được chủ nhóm trả hộ |
| `Removed` | Đã bị loại |

---

## Các Tính Năng Chi Tiết

### 1. Tạo & Tham Gia Nhóm

- **Host** tạo nhóm → nhận group code (8 ký tự)
- Invite thành viên qua **QR code** hoặc **link**
- Tối đa 8 thành viên
- Mỗi phòng chỉ cho 1 nhóm active

### 2. Chọn Ghế (Real-time)

- WebSocket同步 chọn ghế giữa các thành viên
- Mỗi người chọn tối đa 10 ghế
- Ghế bị người khác giữ → hiển thị màu đỏ
- Xác nhận ghế → không thể thay đổi

### 3. Bình Chọn Phim

- Mỗi thành viên vote 1 phim
- Countdown 60 giây
- Phim nhiều vote nhất được chọn
- Nếu hết giờ không ai vote → chọn phim mặc định

### 4. Phương Thức Thanh Toán

#### Host Pay All
- Chủ nhóm trả toàn bộ tiền
- Tạo 1 VNPay transaction cho cả nhóm
- TxnRef: `GROUP-{sessionId前12位}`

#### Individual Pay
- Mỗi người tự trả phần mình
- Tạo VNPay transaction riêng cho mỗi thành viên
- TxnRef: `GROUPMEM-{memberId}-{timestamp}`
- Hỗ trợ retry (timestamp tránh duplicate)

#### Pair Pay
- Ghép đôi 2 người để trả chung
- System tự ghép đôi dựa trên đề xuất
- Hoặc tự chọn partner

### 5. Chat Nhóm

- Tin nhắn real-time qua WebSocket
- Hỗ trợ tin nhắn text và hệ thống (payment events)
- Lưu lịch sử chat trong DB

### 6. Xử Lý Thanh Toán Thất Bại

Khi một thành viên thanh toán thất bại, hệ thống hiện **3 lựa chọn**:

| Lựa Chọn | Mô Tả |
|---|---|
| **Hủy đơn & hoàn tiền** | Hủy đơn của người fail, hoàn tiền |
| **Người trả hộ** | Có thành viên tình nguyện trả thay |
| **Loại người fail** | Hủy đơn, người đó bị loại khỏi nhóm |

**Cơ chế vote:**
- Majority vote = `(tổng thành viên / 2) + 1`
- Countdown vote: 20s (2 người), 30s (3-4), 45s (5+)
- Nếu 2+ người volunteer → cho cả nhóm vote chọn ai trả

### 7. Countdown Timer

- **Vote phương thức**: 60 giây
- **Vote xử lý fail**: 20-45 giây (tùy số người)
- **Payment deadline**: 10 phút (tự hủy phòng nếu hết hạn)

---

## API Endpoints

### Group Management
```
POST   /api/v1/booking/group/create          Tạo nhóm
POST   /api/v1/booking/group/join             Tham gia nhóm
POST   /api/v1/booking/group/leave/:id        Rời nhóm
GET    /api/v1/booking/group/state/:id        Lấy trạng thái nhóm
```

### Seat Selection
```
POST   /api/v1/booking/group/seats/:id        Chọn/bỏ chọn ghế
POST   /api/v1/booking/group/confirm/:id      Xác nhận ghế
```

### Payment
```
POST   /api/v1/booking/group/pay/:id          Tạo VNPay URL thanh toán
POST   /api/v1/booking/group/payment-action/:id  Host xử lý fail (Cover/TakeOver/Cancel)
GET    /api/v1/booking/group/vnpay-callback    VNPay callback
```

### Voting
```
POST   /api/v1/booking/group/vote/:id                Vote phim
POST   /api/v1/booking/group/vote-payment-method/:id  Vote phương thức thanh toán
GET    /api/v1/booking/group/payment-method-vote/:id   Lấy trạng thái vote
POST   /api/v1/booking/group/vote-payment-failure/:id  Vote xử lý fail
POST   /api/v1/booking/group/raise-hand/:id            Tình nguyện trả hộ
```

### Pairing
```
POST   /api/v1/booking/group/pair/:id           Gửi lời mời ghép đôi
POST   /api/v1/booking/group/pair/:id/respond/:pairId  Chấp nhận/từ chối
GET    /api/v1/booking/group/pairs/:id          Lấy danh sách cặp
```

### Chat
```
POST   /api/v1/booking/group/chat/:id           Gửi tin nhắn
GET    /api/v1/booking/group/chat/:id           Lấy lịch sử chat
```

### WebSocket
```
GET    /api/v1/booking/group/ws/:id             Kết nối WebSocket
```

---

## WebSocket Events

| Event Type | Mô Tả |
|---|---|
| `initial-state` | Trạng thái ban đầu khi kết nối |
| `group-update` | Cập nhật trạng thái nhóm |
| `chat-message` | Tin nhắn mới |
| `vote-update` | Cập nhật vote phim |
| `payment-method-vote-update` | Cập nhật vote phương thức thanh toán |
| `payment-failure-vote-update` | Cập nhật vote xử lý fail |
| `raise-hand-update` | Cập nhật tình nguyện viên |
| `pair-update` | Cập nhật ghép đôi |
| `payment-action` | Host xử lý thanh toán |

---

## Kiến Trúc Backend

### Use Cases (18 use cases)

```
UseCases/Booking/SocialBooking/
├── CreateGroupBookingUseCase.cs      Tạo nhóm
├── JoinGroupBookingUseCase.cs        Tham gia nhóm
├── LeaveGroupBookingUseCase.cs       Rời nhóm
├── GetGroupBookingStateUseCase.cs    Lấy trạng thái (bao gồm auto-cancel)
├── SelectGroupSeatsUseCase.cs        Chọn ghế
├── ConfirmGroupMemberSeatsUseCase.cs Xác nhận ghế
├── PayGroupBookingUseCase.cs         Tạo VNPay URL
├── SendGroupChatMessageUseCase.cs    Gửi tin nhắn
├── GetGroupChatMessagesUseCase.cs    Lấy lịch sử chat
├── VoteGroupMovieUseCase.cs          Vote phim
├── VotePaymentMethodUseCase.cs       Vote phương thức thanh toán
├── ResolvePaymentMethodVoteUseCase.cs Xử lý timeout vote
├── CreateGroupPairRequestUseCase.cs  Tạo lời mời ghép đôi
├── RespondGroupPairRequestUseCase.cs Phản hồi ghép đôi
├── GetGroupPairsUseCase.cs           Lấy danh sách cặp
├── VotePaymentFailureUseCase.cs      Vote xử lý fail
├── RaiseHandUseCase.cs               Tình nguyện trả hộ
└── HandleGroupPaymentFailureUseCase.cs Xử lý kết quả vote fail
```

### Redis Cache Keys

```
group:{sessionId}:votes:{scheduleId}       Votes phim
group:{sessionId}:vote endTime             Thời gian hết vote
group:{sessionId}:chat                     Tin nhắn chat
group:{sessionId}:pairs                    Danh sách cặp
group:{sessionId}:fail:votes:{memberId}    Votes xử lý fail
group:{sessionId}:fail:hands:{memberId}    Tình nguyện viên
```

### Entities

```
GroupBookingSessionEntity     Phiên nhóm (status, paymentMethod, voteStatus...)
GroupBookingMemberEntity      Thành viên (status, amountToPay, amountPaid...)
GroupBookingSeatEntity        Ghế đã chọn
GroupChatMessageEntity        Tin nhắn chat
```

---

## Frontend Components

| Component | Mô Tả |
|---|---|
| `SocialBookingPage.tsx` | Trang chính, quản lý trạng thái và routing |
| `GroupSeatGrid.tsx` | Sơ đồ ghế real-time |
| `GroupMovieVote.tsx` | Bình chọn phim |
| `PaymentMethodVoteView.tsx` | Vote phương thức thanh toán |
| `PairsSummaryView.tsx` | Danh sách thanh toán |
| `GroupCheckoutView.tsx` | Checkout view (legacy) |
| `GroupSuccessView.tsx` | Trang thành công |
| `PaymentFailureVoteModal.tsx` | Modal vote xử lý fail |
| `GroupPaymentModal.tsx` | Modal xử lý thanh toán của host |
| `PairRequestModal.tsx` | Modal ghép đôi |
| `GroupMemberList.tsx` | Danh sách thành viên |
| `GroupChatPanel.tsx` | Chat nhóm |
| `CountdownTimer.tsx` | Đếm ngược |
| `CreateGroupBookingModal.tsx` | Modal tạo nhóm |

---

## Files Liên Quan

### Backend
- `apps/backend/Cinema.Api/Controllers/Customer/Booking/GroupBookingController.cs`
- `apps/backend/Cinema.Application/UseCases/Booking/SocialBooking/*.cs`
- `apps/backend/Cinema.Application/UseCases/Booking/ProcessVnPayCallbackUseCase.cs`
- `apps/backend/Cinema.Domain/Entities/GroupBooking/*.cs`
- `apps/backend/Cinema.Domain/Enums/Group*.cs`
- `apps/backend/Cinema.Infrastructure/ExternalServices/Cache/GroupBookingCacheService.cs`
- `apps/backend/Cinema.Infrastructure/ExternalServices/Cache/VoteTimeoutScheduler.cs`
- `apps/backend/Cinema.Infrastructure/ExternalServices/Notifications/SeatLockerNotificationService.cs`

### Frontend
- `apps/frontend/src/features/socialBooking/*.tsx` (14 files)
- `apps/frontend/src/api/socialBookingApi.ts`
- `apps/frontend/src/types/socialBooking.types.ts`
- `apps/frontend/src/i18n/locales/{en,vi,ru}/translation.json` (socialBooking namespace)
