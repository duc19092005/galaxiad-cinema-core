import httpx
from langchain_core.tools import tool
from config import BACKEND_API_URL
from loguru import logger

@tool
async def get_available_vouchers_tool(user_id: str) -> str:
    """
    Tra cứu danh sách voucher khả dụng của người dùng đã đăng nhập.
    Nếu user_id trống hoặc là Guest/NA, trả về thông báo không có voucher.
    """
    if not user_id or user_id in ["", "N/A", "Guest"]:
        return "Không có voucher khả dụng (Khách vãng lai)."

    url = f"{BACKEND_API_URL}/vouchers/available-for-user?userId={user_id}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                vouchers = data.get("data", [])
                if not vouchers:
                    return "Bạn không có voucher khả dụng nào."
                
                result = []
                for v in vouchers:
                    desc = f"Mã: {v.get('code')} (ID: {v.get('voucherId')}) - Giảm {v.get('discountAmount')}%"
                    if v.get('requiredPoints', 0) > 0:
                        desc += f" (Cần {v.get('requiredPoints')} điểm tích lũy)"
                    else:
                        desc += " (Công khai)"
                    result.append(desc)
                return "\n".join(result)
            else:
                return "Không thể tra cứu voucher lúc này từ hệ thống."
    except Exception as e:
        logger.error(f"Error fetching vouchers: {e}")
        return f"Lỗi khi tra cứu voucher: {str(e)}"

@tool
async def suggest_seats_tool(schedule_id: str, quantity: int) -> str:
    """
    Tự động phân tích tọa độ ghế phòng chiếu để tìm và gợi ý cụm ghế trống đẹp nhất sát khu vực trung tâm.
    Tham số:
    - schedule_id: ID lịch chiếu
    - quantity: Số lượng vé cần mua
    """
    if quantity <= 0:
        return "Số lượng ghế phải lớn hơn 0."
        
    url = f"{BACKEND_API_URL}/public/movies/schedules/{schedule_id}/seats"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code != 200:
                return "Không thể tải sơ đồ ghế cho lịch chiếu này từ backend."
                
            res_json = response.json()
            data = res_json.get("data", {})
            seats = data.get("seats", [])
            
            if not seats:
                return "Phòng chiếu không có ghế hoặc không tìm thấy sơ đồ."

            # Đọc tọa độ trung tâm được cấu hình bởi admin
            center_row_start = data.get("centerRowStart", 0)
            center_row_end = data.get("centerRowEnd", 0)
            center_col_start = data.get("centerColStart", 0)
            center_col_end = data.get("centerColEnd", 0)
            
            # Nếu chưa cấu hình tọa độ trung tâm, mặc định là khu vực 1/3 ở giữa
            all_rows = [s.get("rowIndex") for s in seats]
            all_cols = [s.get("colIndex") for s in seats]
            max_row = max(all_rows) if all_rows else 10
            max_col = max(all_cols) if all_cols else 15
            
            if center_row_start == 0 and center_row_end == 0:
                center_row_start = max_row // 3
                center_row_end = 2 * (max_row // 3)
            if center_col_start == 0 and center_col_end == 0:
                center_col_start = max_col // 3
                center_col_end = 2 * (max_col // 3)
                
            # Tính toán tọa độ tâm của vùng trung tâm
            target_row = (center_row_start + center_row_end) / 2.0
            target_col = (center_col_start + center_col_end) / 2.0
            
            available_seats = [s for s in seats if not s.get("isOccupied")]
            if len(available_seats) < quantity:
                return f"Không đủ ghế trống. Chỉ còn {len(available_seats)} ghế trống."
                
            # Gom nhóm ghế trống theo từng hàng (RowIndex) để ưu tiên xếp ghế liền kề nhau
            seats_by_row = {}
            for s in available_seats:
                r = s.get("rowIndex")
                if r not in seats_by_row:
                    seats_by_row[r] = []
                seats_by_row[r].append(s)
                
            valid_clusters = []
            
            # Tìm cụm N ghế liên tục nhau trên cùng một hàng
            for r, row_seats in seats_by_row.items():
                row_seats.sort(key=lambda x: x.get("colIndex"))
                for i in range(len(row_seats) - quantity + 1):
                    subset = row_seats[i:i+quantity]
                    # Kiểm tra xem có liên tiếp về mặt ColIndex không
                    is_consecutive = True
                    for j in range(1, quantity):
                        if subset[j].get("colIndex") != subset[j-1].get("colIndex") + 1:
                            is_consecutive = False
                            break
                    if is_consecutive:
                        # Tính khoảng cách trung bình đến tâm vùng trung tâm
                        avg_row = sum(s.get("rowIndex") for s in subset) / float(quantity)
                        avg_col = sum(s.get("colIndex") for s in subset) / float(quantity)
                        dist = (avg_row - target_row)**2 + (avg_col - target_col)**2
                        valid_clusters.append((subset, dist))
                        
            # Nếu không tìm thấy cụm ghế liên tiếp, gợi ý các ghế đơn lẻ gần tâm nhất
            if not valid_clusters:
                available_seats.sort(key=lambda s: (s.get("rowIndex") - target_row)**2 + (s.get("colIndex") - target_col)**2)
                selected_seats = available_seats[:quantity]
                seat_numbers = ", ".join([s.get("seatNumber") for s in selected_seats])
                seat_ids = [s.get("seatId") for s in selected_seats]
                return f"Gợi ý chọn các ghế lẻ gần trung tâm nhất (không có ghế liền kề): {seat_numbers} (IDs: {seat_ids})"
                
            # Sắp xếp các cụm ghế liên tục theo khoảng cách tăng dần tới tâm
            valid_clusters.sort(key=lambda x: x[1])
            best_subset = valid_clusters[0][0]
            seat_numbers = ", ".join([s.get("seatNumber") for s in best_subset])
            seat_ids = [s.get("seatId") for s in best_subset]
            
            return f"Gợi ý chọn cụm ghế sát nhau tại vùng trung tâm: {seat_numbers} (IDs: {seat_ids})"
            
    except Exception as e:
        logger.error(f"Error suggesting seats: {e}")
        return f"Lỗi tính toán gợi ý ghế: {str(e)}"

@tool
async def confirm_booking_tool(schedule_id: str, seat_ids: list, customer_email: str, customer_name: str = "", customer_phone: str = "", payment_method: int = 0, voucher_id: str = "") -> str:
    """
    Thực hiện đặt vé qua API hệ thống chính, khóa ghế và lấy link thanh toán.
    Tham số:
    - schedule_id: ID lịch chiếu
    - seat_ids: Mảng danh sách Seat IDs
    - customer_email: Email người nhận vé
    - customer_name: Tên khách hàng (mặc định 'Chatbot User')
    - customer_phone: Số điện thoại nhận thông báo
    - payment_method: 0 = VNPAY, 1 = GOOGLEPAY, 2 = CASH
    - voucher_id: ID Voucher cần áp dụng (nếu có)
    """
    url = f"{BACKEND_API_URL}/booking/create"
    
    payload = {
        "scheduleId": schedule_id,
        "seatSelections": [{"seatId": sid} for sid in seat_ids],
        "customerEmail": customer_email,
        "customerName": customer_name or "Khách hàng Chatbot",
        "customerPhone": customer_phone or "0901234567",
        "paymentMethod": payment_method
    }
    
    if voucher_id and voucher_id.strip() not in ["", "null", "None", "undefined"]:
        payload["voucherId"] = voucher_id
        
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code == 200:
                res_json = response.json()
                is_success = res_json.get("isSuccess", False)
                message = res_json.get("message", "")
                data = res_json.get("data", {})
                
                if is_success:
                    order_id = data.get("orderId")
                    payment_url = data.get("paymentUrl")
                    total_amount = data.get("totalAmount")
                    
                    reply = f"Đơn hàng của bạn đã được khởi tạo! Mã đơn: {order_id}. Tổng thanh toán: {total_amount:,} VND."
                    if payment_url:
                        reply += f" Vui lòng click vào liên kết sau để thanh toán: {payment_url}"
                    return reply
                else:
                    return f"Không thể hoàn tất tạo đơn đặt vé: {message}"
            else:
                return f"Lỗi hệ thống backend: Mã HTTP {response.status_code}"
    except Exception as e:
        logger.error(f"Error confirming booking: {e}")
        return f"Lỗi kết nối đặt vé: {str(e)}"
