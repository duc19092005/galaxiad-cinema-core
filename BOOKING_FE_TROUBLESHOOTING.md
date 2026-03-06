# 🛠️ Hướng dẫn Fix lỗi 400 "Validation error" cho Frontend

Nếu bạn đang gặp lỗi sau khi gửi request `POST /api/v1/booking/create`:
```json
{
    "statusCode": 400,
    "errorCode": "Validation error",
    "message": "The request field is required.",
    "errors": [
        "The request field is required."
    ]
}
```

Dưới đây là các nguyên nhân phổ biến và cách khắc phục:

---

## 1. Dấu cách thừa trong ID (Lỗi chính của bạn)
Trong JSON bạn gửi lên, trường `scheduleId` đang có một **dấu cách ở đầu**:
- ❌ Sai: `"scheduleId": " 99999999-..."`
- ✅ Đúng: `"scheduleId": "99999999-..."`

**Tại sao lỗi?**
Backend quy định kiểu dữ liệu là `Guid`. Hệ thống không thể tự động chuyển đổi chuỗi có dấu cách `" 999..."` thành một mã `Guid` hợp lệ, dẫn đến việc toàn bộ dữ liệu gửi lên bị coi là null (trống). Khi `request` object bị null, ASP.NET Core sẽ báo lỗi `"The request field is required."`.

---

## 2. Thiếu Header `Content-Type`
Khi gọi API từ code (Javascript `fetch` hoặc `axios`), bạn **BẮT BUỘC** phải chỉ định cho Server biết bạn đang gửi nội dung JSON.

**Cách sửa (Javascript):**
```javascript
const response = await fetch('http://localhost:5032/api/v1/booking/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json', // <--- QUAN TRỌNG
  },
  body: JSON.stringify({
    scheduleId: "99999999-9999-9999-9999-999999999999", // Xóa dấu cách ở đây
    seatIds: ["9408cd0f-04e4-47c5-b1e8-8244b6c87657"],
    customerName: "Test Multi Role Account",
    customerEmail: "duc19092005d@gmail.com",
    customerAddress: "123213"
  })
});
```

---

## 3. Kiểm tra thông tin ghế (SeatIds)
Hãy đảm bảo `seatIds` bạn gửi lên là một mảng các GUID hợp lệ (vẽ từ API `.../seats` trả về). Nếu gửi chuỗi trống hoặc sai format GUID trong mảng, nó cũng sẽ gây lỗi 400.

---

## 4. Kiểm tra Auth (withCredentials)
Vì endpoint này có `[Authorize]`, hãy đảm bảo bạn đã cấu hình FE để gửi kèm Cookie (X-Access-Token):
- Sử dụng `credentials: 'include'` (cho fetch)
- Hoặc `withCredentials: true` (cho axios)

---

## 💡 Mẹo Debug:
Bạn hãy mở **Tab Network** trong trình duyệt (F12), tìm request bị lỗi, vào phần **Payload** (hoặc Request Body) để xem chính xác chuỗi JSON đang gửi đi có bị thừa dấu cách hay sai cấu trúc hay không.
