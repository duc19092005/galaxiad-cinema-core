# 🎬 Cinema Booking API Documentation

> **Base URL**: `http://localhost:5032`
> **Auth**: JWT Bearer Token (Cookie: `X-Access-Token`)
> **Language Header**: `X-Language: vi` hoặc `en` (default: `en`)

---

## 📋 Mục lục

1. [Tổng quan Flow đặt vé](#-tổng-quan-flow-đặt-vé)
2. [Public APIs (Không cần đăng nhập)](#-public-apis)
   - Lấy rạp, lịch chiếu, sơ đồ ghế, **thông tin giá**
3. [Booking APIs (Cần đăng nhập)](#-booking-apis)
4. [SSE - Realtime Payment Status](#-sse---realtime-payment-status)
5. [Data Models](#-data-models)
6. [Error Codes](#-error-codes)

---

## 🔄 Tổng quan Flow đặt vé

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  Trang chủ  │───>│ Chi tiết    │───>│ Chọn rạp +   │───>│ Thông tin   │───>│  Chọn ghế   │───>│  Đặt vé +    │
│  Phim đang  │    │ phim        │    │ Lịch chiếu   │    │ giá         │    │             │    │  Thanh toán  │
│  /sắp chiếu │    │             │    │              │    │             │    │             │    │  VNPay       │
└─────────────┘    └─────────────┘    └──────────────┘    └─────────────┘    └─────────────┘    └──────────────┘
     GET                GET               GET                 GET                GET               POST
  /now-showing      /{movieId}        /{movieId}/         /schedules/       /schedules/        /booking/create
  /coming-soon                        showtimes           {id}/prices       {id}/seats
```

### Flow thanh toán VNPay + SSE:

```
┌──────┐          ┌──────────┐         ┌────────┐         ┌──────┐
│  FE  │          │ Backend  │         │ VNPay  │         │  FE  │
└──┬───┘          └────┬─────┘         └───┬────┘         └──┬───┘
   │                   │                   │                 │
   │ POST /booking/create                  │                 │
   │──────────────────>│                   │                 │
   │                   │ Tạo Order (Pending)                 │
   │  {paymentUrl}     │                   │                 │
   │<──────────────────│                   │                 │
   │                   │                   │                 │
   │ Mở paymentUrl     │                   │                 │
   │──────────────────────────────────────>│                 │
   │                   │                   │                 │
   │ GET /booking/payment-status/{orderId} (SSE)             │
   │──────────────────>│                   │                 │
   │  : heartbeat      │                   │                 │
   │<──────────────────│                   │                 │
   │                   │                   │                 │
   │                   │ GET /vnpay-callback                 │
   │                   │<──────────────────│                 │
   │                   │ Update Order       │                 │
   │                   │ (Booked/Canceled)  │                 │
   │                   │                   │                 │
   │ event: payment-result                 │                 │
   │<──────────────────│                   │                 │
   │                   │                   │                 │
   │                   │ Redirect FE       │                 │
   │                   │──────────────────────────────────>  │
   └───────────────────┴───────────────────┴─────────────────┘
```

---

## 🌐 Public APIs

### 1. Lấy danh sách phim đang chiếu

```
GET /api/v1/public/movies/now-showing
```

**Auth**: ❌ Không cần

**Response**:
```json
{
  "isSuccess": true,
  "message": "Get Movies Info Success",
  "data": [
    {
      "movieId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "movieName": "Avengers: Endgame",
      "movieImageUrl": "https://res.cloudinary.com/...",
      "movieDescription": "Siêu anh hùng Marvel...",
      "movieDuration": 180,
      "startedDate": "2026-03-01T00:00:00",
      "endedDate": "2026-04-01T00:00:00",
      "movieRequiredAgeSymbol": "T13",
      "movieGenres": ["Hành động", "Phiêu lưu"],
      "movieFormats": ["2D", "3D", "IMAX"]
    }
  ]
}
```

---

### 2. Lấy danh sách phim sắp chiếu

```
GET /api/v1/public/movies/coming-soon
```

**Auth**: ❌ Không cần

**Response**: Cùng format với [Phim đang chiếu](#1-lấy-danh-sách-phim-đang-chiếu)

---

### 3. Lấy chi tiết phim

```
GET /api/v1/public/movies/{movieId}
```

**Auth**: ❌ Không cần

**Params**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| movieId | GUID | ✅ | ID của phim |

**Response**:
```json
{
  "isSuccess": true,
  "message": "Get Movie Info Successfully",
  "data": {
    "movieId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "movieName": "Avengers: Endgame",
    "movieImageUrl": "https://res.cloudinary.com/...",
    "movieDescription": "Siêu anh hùng Marvel...",
    "trailerUrl": "https://youtube.com/watch?v=...",
    "director": "Anthony Russo, Joe Russo",
    "actors": "Robert Downey Jr., Chris Evans, Scarlett Johansson",
    "movieDuration": 180,
    "startedDate": "2026-03-01T00:00:00",
    "endedDate": "2026-04-01T00:00:00",
    "movieRequiredAgeSymbol": "T13",
    "movieGenres": ["Hành động", "Phiêu lưu"],
    "movieFormats": ["2D", "3D", "IMAX"]
  }
}
```

---

### 4. Lấy danh sách thành phố có rạp

```
GET /api/v1/public/movies/cities
```

**Auth**: ❌ Không cần

**Response**:
```json
{
  "isSuccess": true,
  "message": "Get cities list successfully",
  "data": [
    {
      "cityName": "Hồ Chí Minh",
      "cinemaCount": 5
    },
    {
      "cityName": "Hà Nội",
      "cinemaCount": 3
    }
  ]
}
```

---

### 5. Lấy rạp + lịch chiếu theo phim & thành phố

```
GET /api/v1/public/movies/{movieId}/showtimes?city={city}&date={date}
```

**Auth**: ❌ Không cần

**Query Params**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| movieId | GUID | ✅ | ID của phim |
| city | string | ✅ | Tên thành phố (VD: "Hồ Chí Minh") |
| date | DateTime | ❌ | Ngày muốn xem (default: hôm nay). Format: `2026-03-06` |

**Response**:
```json
{
  "isSuccess": true,
  "message": "Get showtimes successfully",
  "data": [
    {
      "cinemaId": "...",
      "cinemaName": "CGV Vincom Đồng Khởi",
      "cinemaLocation": "72 Lê Thánh Tôn, Quận 1",
      "cinemaCity": "Hồ Chí Minh",
      "formatShowtimes": [
        {
          "formatId": "...",
          "formatName": "2D Phụ đề",
          "showtimes": [
            {
              "scheduleId": "...",
              "startTime": "2026-03-06T14:00:00",
              "endedTime": "2026-03-06T17:00:00",
              "auditoriumId": "...",
              "auditoriumNumber": "Phòng 1"
            },
            {
              "scheduleId": "...",
              "startTime": "2026-03-06T18:00:00",
              "endedTime": "2026-03-06T21:00:00",
              "auditoriumId": "...",
              "auditoriumNumber": "Phòng 3"
            }
          ]
        },
        {
          "formatId": "...",
          "formatName": "3D",
          "showtimes": [
            {
              "scheduleId": "...",
              "startTime": "2026-03-06T15:30:00",
              "endedTime": "2026-03-06T18:30:00",
              "auditoriumId": "...",
              "auditoriumNumber": "Phòng 2"
            }
          ]
        }
      ]
    }
  ]
}
```

---

### 6. Lấy sơ đồ ghế cho lịch chiếu

```
GET /api/v1/public/movies/schedules/{scheduleId}/seats
```

**Auth**: ❌ Không cần

**Params**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| scheduleId | GUID | ✅ | ID của lịch chiếu |

**Response**:
```json
{
  "isSuccess": true,
  "message": "Get seat map successfully",
  "data": {
    "scheduleId": "...",
    "auditoriumNumber": "Phòng 1",
    "movieName": "Avengers: Endgame",
    "formatName": "2D Phụ đề",
    "startTime": "2026-03-06T14:00:00",
    "seats": [
      {
        "seatId": "...",
        "seatNumber": "A1",
        "colIndex": 0,
        "rowIndex": 0,
        "isOccupied": false
      },
      {
        "seatId": "...",
        "seatNumber": "A2",
        "colIndex": 1,
        "rowIndex": 0,
        "isOccupied": true
      },
      {
        "seatId": "...",
        "seatNumber": "B1",
        "colIndex": 0,
        "rowIndex": 1,
        "isOccupied": false
      }
    ]
  }
}
```

> **Lưu ý**: `isOccupied = true` nghĩa là ghế đã có người đặt (Pending hoặc đã thanh toán). FE hiển thị ghế này không cho chọn.

---

### 7. Lấy thông tin giá cho lịch chiếu (theo đối tượng)

```
GET /api/v1/public/movies/schedules/{scheduleId}/prices
```

**Auth**: ❌ Không cần

**Params**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| scheduleId | GUID | ✅ | ID của lịch chiếu |

**Response**:
```json
{
  "isSuccess": true,
  "message": "Get pricing successfully",
  "data": {
    "scheduleId": "...",
    "basePrice": 100000.0,
    "segmentPrices": [
      {
        "userSegmentId": "...",
        "segmentName": "Adult",
        "description": "Người lớn",
        "finalPrice": 100000.0
      },
      {
        "userSegmentId": "...",
        "segmentName": "Student",
        "description": "Học sinh, sinh viên (giảm 20%)",
        "finalPrice": 80000.0
      }
    ]
  }
}
```

---

## 🔐 Booking APIs

### 8. Tạo đơn đặt vé

```
POST /api/v1/booking/create
```

**Auth**: ✅ Cần đăng nhập (JWT)

**Headers**:
```
Cookie: X-Access-Token=<jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "scheduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "seatIds": [
    "seat-id-1",
    "seat-id-2"
  ],
  "customerName": "Nguyễn Văn A",
  "customerAddress": "123 Nguyễn Huệ, Q1, HCM",
  "customerEmail": "user@example.com"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| scheduleId | GUID | ✅ | ID lịch chiếu |
| seatIds | GUID[] | ✅ | Danh sách ID ghế đã chọn (tối thiểu 1) |
| customerName | string | ❌ | Tên khách hàng |
| customerAddress | string | ❌ | Địa chỉ |
| customerEmail | string | ❌ | Email (phải đúng format) |

**Response (200)**:
```json
{
  "isSuccess": true,
  "message": "Booking created successfully",
  "data": {
    "orderId": "order-uuid-here",
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=...",
    "totalPrice": 250000.00,
    "totalQuantity": 2,
    "orderDate": "2026-03-06T20:30:00"
  }
}
```

> **Quan trọng**: Sau khi nhận `paymentUrl`, FE cần:
> 1. Mở `paymentUrl` trên trình duyệt (redirect hoặc window.open)
> 2. Subscribe SSE để nhận kết quả thanh toán realtime

**Errors**:
| Error Code | Message | Description |
|-----------|---------|-------------|
| BK01 | Schedule not found or movie is inactive | Lịch chiếu không tồn tại hoặc phim đã ngừng chiếu |
| BK02 | This showtime has already started | Suất chiếu đã bắt đầu |
| BK03 | One or more selected seats are invalid | Ghế không thuộc phòng chiếu |
| BK04 | One or more selected seats are already booked | Ghế đã có người đặt |

---

### 9. VNPay Callback (Backend tự xử lý)

```
GET /api/v1/booking/vnpay-callback?vnp_Amount=...&vnp_ResponseCode=...
```

> ⚠️ **FE KHÔNG cần gọi endpoint này**. VNPay tự động redirect về đây sau khi thanh toán.
> Backend sẽ:
> 1. Validate signature từ VNPay
> 2. Cập nhật trạng thái đơn hàng (Booked/Canceled)
> 3. Gửi SSE event cho FE
> 4. Redirect user về FE:
>    - Thành công: `http://localhost:5173/booking/success?orderId={orderId}`
>    - Thất bại: `http://localhost:5173/booking/failed?orderId={orderId}`

---

## 📡 SSE - Realtime Payment Status

### 10. Subscribe kết quả thanh toán (SSE)

```
GET /api/v1/booking/payment-status/{orderId}
```

**Auth**: ✅ Cần đăng nhập (JWT)

**Headers**:
```
Cookie: X-Access-Token=<jwt_token>
Accept: text/event-stream
```

**Cách sử dụng trên FE (JavaScript/Web)**:
```javascript
const orderId = "order-uuid-here";

const eventSource = new EventSource(
  `http://localhost:5032/api/v1/booking/payment-status/${orderId}`,
  { withCredentials: true }
);

// Nhận kết quả thanh toán
eventSource.addEventListener("payment-result", (event) => {
  const data = JSON.parse(event.data);
  console.log("Payment result:", data);
  
  if (data.status === "success") {
    // Hiển thị thông báo thành công
    // Redirect tới trang vé
  } else {
    // Hiển thị thông báo thất bại
  }
  
  eventSource.close();
});

// Heartbeat (mỗi 15s, giữ connection sống)
// Tự động xử lý bởi EventSource

// Xử lý lỗi
eventSource.onerror = (error) => {
  console.error("SSE Error:", error);
  eventSource.close();
};
```

**Cách sử dụng trên Mobile (React Native/Flutter)**:
```javascript
// React Native - sử dụng thư viện eventsource hoặc fetch streaming
const response = await fetch(
  `http://localhost:5032/api/v1/booking/payment-status/${orderId}`,
  {
    headers: {
      "Cookie": `X-Access-Token=${token}`,
      "Accept": "text/event-stream"
    }
  }
);

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  if (text.includes("event: payment-result")) {
    const dataLine = text.split("\n").find(l => l.startsWith("data:"));
    if (dataLine) {
      const data = JSON.parse(dataLine.substring(5));
      // Handle payment result
    }
  }
}
```

**SSE Event Format**:
```
event: payment-result
data: {"orderId":"...","status":"success","message":"Payment completed successfully","transactionId":"14057704","totalPrice":250000.00}
```

**Payment Status Values**:
| Status | Description |
|--------|-------------|
| `success` | Thanh toán thành công, vé đã được xác nhận |
| `failed` | Thanh toán thất bại hoặc bị hủy |

> **Lưu ý**: SSE connection tự động timeout sau **15 phút**. Nếu user chưa thanh toán trong 15 phút, FE cần hiển thị thông báo hết hạn.

---

## 📦 Data Models

### Movie Info (Đang chiếu / Sắp chiếu)
```typescript
interface MovieListItem {
  movieId: string;
  movieName: string;
  movieImageUrl: string;
  movieDescription: string;
  movieDuration: number;        // Phút
  startedDate: string;          // ISO 8601
  endedDate: string;            // ISO 8601
  movieRequiredAgeSymbol: string; // "P", "T13", "T16", "T18", "C"
  movieGenres: string[];        // ["Hành động", "Phiêu lưu"]
  movieFormats: string[];       // ["2D", "3D", "IMAX"]
}
```

### Movie Detail
```typescript
interface MovieDetail extends MovieListItem {
  trailerUrl: string;           // YouTube URL
  director: string;             // "Anthony Russo, Joe Russo"
  actors: string;               // "Robert Downey Jr., Chris Evans"
}
```

### Seat
```typescript
interface Seat {
  seatId: string;
  seatNumber: string;           // "A1", "B5", ...
  colIndex: number;             // Cột (dùng để render grid)
  rowIndex: number;             // Hàng (dùng để render grid)
  isOccupied: boolean;          // true = đã đặt, false = còn trống
}
```

### Order
```typescript
interface CreateBookingRequest {
  scheduleId: string;
  seatIds: string[];
  customerName?: string;
  customerAddress?: string;
  customerEmail?: string;
}

interface CreateBookingResponse {
  orderId: string;
  paymentUrl: string;           // Redirect tới URL này
  totalPrice: number;
  totalQuantity: number;
  orderDate: string;
}
```

### Payment Event (SSE)
```typescript
interface PaymentEvent {
  orderId: string;
  status: "success" | "failed";
  message: string;
  transactionId?: string;
  totalPrice?: number;
}
```

---

## ❌ Error Codes

### HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | Thành công |
| 400 | Bad Request - Dữ liệu không hợp lệ |
| 401 | Unauthorized - Chưa đăng nhập |
| 404 | Not Found - Không tìm thấy resource |
| 500 | Internal Server Error |

### Business Error Codes
| Code | Message | Mô tả |
|------|---------|-------|
| BK01 | Schedule not found or movie is inactive | Lịch chiếu không tồn tại / phim ngừng hoạt động |
| BK02 | This showtime has already started | Suất chiếu đã qua |
| BK03 | One or more selected seats are invalid | Ghế không hợp lệ |
| BK04 | One or more selected seats are already booked | Ghế đã được đặt |

### Error Response Format
```json
{
  "statusCode": 400,
  "errorCode": "BK04",
  "message": "One or more selected seats are already booked",
  "errors": ["One or more selected seats are already booked"]
}
```

---

## 🔧 Cấu hình cần thiết

### FE Routes cần tạo
| Route | Mô tả |
|-------|-------|
| `/booking/success?orderId={id}` | Trang hiển thị kết quả thanh toán thành công |
| `/booking/failed?orderId={id}` | Trang hiển thị kết quả thanh toán thất bại |

### VNPay Sandbox
- URL thanh toán test: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
- Thẻ test: Xem tại [VNPay Docs](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html)

### CORS
FE chạy ở `http://localhost:5173` đã được cấu hình CORS.

---

## 🔄 Movie Manager API Updates

### Tạo phim - Thêm fields mới

```
POST /api/movieManager/movies
```

**Auth**: ✅ MovieManager role

**Thêm fields vào form-data**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| TrailerUrl | string | ❌ | URL trailer (YouTube) |
| Director | string | ❌ | Tên đạo diễn |
| Actors | string | ❌ | Danh sách diễn viên (cách nhau bằng dấu phẩy) |

### Cập nhật phim - Thêm fields mới

```
PUT /api/movieManager/movies/{movieId}
```

**Thêm optional fields**:
| Field | Type | Description |
|-------|------|-------------|
| TrailerUrl | string | URL trailer |
| Director | string | Tên đạo diễn |
| Actors | string | Danh sách diễn viên |

### Database Changes

**Bảng `MovieInfoEntity`** - Thêm cột:
- `TrailerUrl` (varchar 2048) - URL trailer
- `Director` (nvarchar 200) - Đạo diễn
- `Actors` (nvarchar 500) - Diễn viên

**Bảng `CinemaInfoEntity`** - Thêm cột:
- `CinemaCity` (nvarchar 100) - Thành phố

**Bảng `MovieScheduleInfoEntity`** - Thêm cột:
- `StartTime` (DateTime) - Giờ bắt đầu chiếu

**Bảng `OrderInfoEntity`** - Thêm cột:
- `VnPayTransactionId` (varchar 100) - Mã giao dịch VNPay

**Bảng `OrderDetailsInfo`** - Sửa composite key:
- Cũ: `(OrderId, MovieScheduleId)`
- Mới: `(OrderId, MovieScheduleId, SeatId)`

> ⚠️ **Cần chạy Migration sau khi pull code mới!**
> ```bash
> dotnet ef migrations add AddBookingFields --project DataAccess --startup-project ApiLayer
> dotnet ef database update --project DataAccess --startup-project ApiLayer
> ```

---

## 🐛 Bug Fixes

### Fix logic tạo phim ảnh hưởng get phim

**Vấn đề**: `MovieGenreMovieInfoEntity` và `MovieScheduleInfoEntity` trong `MovieInfoEntity` được khai báo là **field** (không có `{ get; set; }`) thay vì **property**. EF Core chỉ nhận diện properties, nên khi query phim sẽ **không include được genres và schedules**.

**Fix**: Đã thêm `{ get; set; }` cho tất cả navigation properties:
```csharp
// Trước (BUG):
public List<MovieGenreMovieInfoEntity> MovieGenreMovieInfoEntity = [];
public List<MovieScheduleInfoEntity> MovieScheduleInfoEntity = [];

// Sau (FIX):
public List<MovieGenreMovieInfoEntity> MovieGenreMovieInfoEntity { get; set; } = [];
public List<MovieScheduleInfoEntity> MovieScheduleInfoEntity { get; set; } = [];
```

Tương tự fix cho:
- `movieRequiredAgeEntity.movie_info_entity`
- `AuditoriumInfoEntities.AuditoriumFormatInfosList`
