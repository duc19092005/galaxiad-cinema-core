# Tài Liệu Hướng Dẫn Tích Hợp Realtime Chọn Ghế (SignalR) cho Frontend

Tài liệu này hướng dẫn cách Frontend kết nối WebSockets qua SignalR để hiện thực tính năng "Giữ chỗ Realtime" (Lock ghế khi có người đang chọn) giống như các hệ thống đặt vé xem phim thực tế.

## 1. Cài Đặt Thư Viện

Frontend cần cài đặt package SignalR client chính thức của Microsoft:

```bash
npm install @microsoft/signalr
# hoặc
yarn add @microsoft/signalr
```

## 2. Kết nối tới Hub

URL của SeatHub là: `http://localhost:5032/ws/seat`

### 2.1 Khởi tạo Connection

Khi user vào trang **Chọn Ghế** của một lịch chiếu cụ thể (VD: có `scheduleId`), bạn cần khởi tạo connection như sau:

```javascript
import * as signalR from '@microsoft/signalr';

const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5032/ws/seat")
    .withAutomaticReconnect() // Tự động kết nối lại nếu rớt mạng
    .build();

// Start connection
async function startConnection() {
    try {
        await connection.start();
        console.log("SignalR Connected.");
        
        // Ngay sau khi connect thành công, join vào phòng của suất chiếu này
        const scheduleId = "88888888-8888-8888-8888-888888888888"; 
        await connection.invoke("JoinSchedule", scheduleId);
    } catch (err) {
        console.error(err);
    }
}

startConnection();
```

## 3. Lắng nghe các sự kiện (Nhận thông báo từ người khác)

Bạn cần lắng nghe 2 sự kiện chính để cập nhật UI danh sách ghế:

```javascript
// 1. Khi có MỘT NGƯỜI KHÁC vừa bấm vào một ghế
connection.on("OnSeatSelected", (seatId, userName) => {
    console.log(`Ghế ${seatId} đang được chọn bởi ${userName}`);
    // -> TODO: Cập nhật state UI. 
    // -> Đổi màu ghế này thành "Đang có người chọn" (Ví dụ màu vàng / xám đậm)
    // -> Vô hiệu hóa (disable) không cho user hiện tại bấm vào ghế này
});

// 2. Khi MỘT NGƯỜI KHÁC bỏ chọn ghế 
connection.on("OnSeatUnselected", (seatId) => {
    console.log(`Ghế ${seatId} đã được nhả ra`);
    // -> TODO: Cập nhật state UI.
    // -> Đổi màu ghế trở lại trạng thái "Trống" (Available)
    // -> Enable lại ghế này
});
```

*Lưu ý: Các sự kiện này chỉ phát cho NHỮNG NGƯỜI KHÁC trong cùng phòng, bạn (người gửi) sẽ KHÔNG nhận lại sự kiện của chính mình.*

## 4. Gửi sự kiện (Khi thao tác trên giao diện)

Khi Current User (người dùng hiện tại) click vào chọn hoặc bỏ chọn một ghế, bạn gọi API Hub tương ứng:

```javascript
// Thay bằng scheduleId và Username thực tế
const scheduleId = "88888888-8888-8888-8888-888888888888";
const userName = "Nguyễn Văn A"; // Có thể truyền ID hoặc Name để hiện tooltip

// Khi user bấm CHỌN ghế
async function selectSeat(seatId) {
    // 1. Cập nhật state cục bộ của bạn sang "Selected" (màu xanh lá)
    // 2. Báo cho Backend để Backend báo cho những người khác
    try {
        await connection.invoke("SelectSeat", scheduleId, seatId, userName);
    } catch (err) {
        console.error("Lỗi khi lock ghế", err);
    }
}

// Khi user bấm BỎ CHỌN ghế
async function unselectSeat(seatId) {
    // 1. Cập nhật state cục bộ của bạn sang "Available" (màu trắng)
    // 2. Báo cho Backend
    try {
        await connection.invoke("UnselectSeat", scheduleId, seatId);
    } catch (err) {
        console.error("Lỗi khi unlock ghế", err);
    }
}
```

## 5. Dọn dẹp khi rời khỏi trang

Khi user chuyển sang trang Payment hoặc bấm nút "Back" thoát khỏi trang chọn ghế, bắt buộc phải rời khỏi phòng và ngắt kết nối để tránh lỗi rò rỉ bộ nhớ (memory leak):

```javascript
// Hàm chạy khi Component Unmount (useEffect return function)
async function cleanup() {
    if (connection.state === signalR.HubConnectionState.Connected) {
        const scheduleId = "88888888-8888-8888-8888-888888888888";
        
        // 1. (Optional nhưng khuyến khích) Unselect tự động các ghế user dứt áo ra đi mà chưa thanh toán
        // selectedSeats.forEach(seatId => unselectSeat(seatId)); 
        
        // 2. Rời phòng
        await connection.invoke("LeaveSchedule", scheduleId);
        
        // 3. Ngắt kết nối
        await connection.stop();
    }
}
```

## Tóm tắt Luồng Hoạt Động

1. User A và User B cùng vào trang chọn ghế của suất chiếu lúc 20:00 (Schedule X).
2. UI gọi `JoinSchedule("X")` cho cả 2.
3. User A click chọn ghế `A1`. 
4. UI của User A đổi `A1` thành màu Xanh Lá (do state cục bộ). UI gọi `connection.invoke("SelectSeat", "X", "A1", "User A")`.
5. SignalR Server nhận được, ngay lập tức broadcast tới tất cả người khác trong room.
6. User B nhận được event `OnSeatSelected("A1", "User A")`. 
7. UI của User B tự động khóa ghế `A1`, đổi sang màu Vàng/Xám (với tooltip: "User A đang chọn").
8. Nếu User A bấm bỏ chọn `A1`, gọi `invoke("UnselectSeat")` -> User B nhận được event `OnSeatUnselected`, UI User B mở khóa lại ghế `A1`.
