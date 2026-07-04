import redis
from loguru import logger
from langchain_openai import ChatOpenAI
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.chat_history import InMemoryChatMessageHistory, BaseChatMessageHistory
from langchain_community.chat_message_histories import RedisChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

from config import (
    DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL,
    DEEPSEEK_MODEL,
    REDIS_HOST,
    REDIS_PORT
)
from tools import get_available_vouchers_tool, suggest_seats_tool, confirm_booking_tool

# In-memory history fallback dictionary
_in_memory_histories = {}

def get_message_history(session_id: str) -> BaseChatMessageHistory:
    """
    Tải lịch sử cuộc hội thoại từ Redis (với thời gian sống TTL 30 phút).
    Nếu không kết nối được Redis, tự động fallback sang lưu trữ In-Memory.
    """
    if not session_id or session_id.strip() == "":
        return InMemoryChatMessageHistory()
    
    redis_key = f"cinema:chat:session:{session_id}"
    try:
        # Test connection
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, socket_timeout=1.0)
        r.ping()
        return RedisChatMessageHistory(
            session_id=redis_key,
            url=f"redis://{REDIS_HOST}:{REDIS_PORT}",
            ttl=1800 # 30 phút
        )
    except Exception as e:
        logger.warning(f"Redis memory client disconnected. Fallback to in-memory: {e}")
        if session_id not in _in_memory_histories:
            _in_memory_histories[session_id] = InMemoryChatMessageHistory()
        return _in_memory_histories[session_id]


# Khởi tạo mô hình DeepSeek qua OpenAI interface tương thích
llm = ChatOpenAI(
    api_key=DEEPSEEK_API_KEY,
    base_url=DEEPSEEK_BASE_URL,
    model=DEEPSEEK_MODEL,
    temperature=0.2
)

# Danh sách các công cụ của Agent
tools = [get_available_vouchers_tool, suggest_seats_tool, confirm_booking_tool]

# Định nghĩa câu lệnh hệ thống (System Prompt) cho Agent Đặt Vé
SYSTEM_PROMPT = """You are CinemaPro AI, a smart ticket-booking chatbot assistant for the Galaxiad Cinema system.
Your primary task is to guide the customer (either a logged-in user or an anonymous/guest customer) to book movie tickets in a polite, helpful, and structured manner.

Always communicate in Vietnamese unless requested otherwise by the user.

=== USER CONTEXT ===
- User ID: {user_id}
- User Role: {user_role}
- Supporting Context (from database): {tool_context}

=== BOOKING WORKFLOW (Chain of Thought & Slot-filling) ===
Step 1. Info Gathering (Slot Filling) & Guidance on Vague Requests:
- Nếu người dùng hỏi một câu hỏi chung chung, mơ hồ (ví dụ: "Bạn đặt vé tự động giúp tôi được không?", "Tôi muốn mua vé xem phim", v.v.), TUYỆT ĐỐI không gọi các công cụ (tools) khác hay tra cứu voucher ngay lập tức.
- Thay vào đó, bạn phải hỏi lịch sự để thu thập các thông tin sau:
  1. Tên Phim (Phim bạn muốn xem là gì? Đang có phim A, B, C...)
  2. Tên Rạp (Bạn muốn xem ở rạp nào?)
  3. Suất chiếu (Ngày và giờ chiếu bạn chọn?)
  4. Số lượng vé (Bạn muốn đặt bao nhiêu vé?)
- Bắt buộc phải hỏi khách hàng để làm rõ nếu bất kỳ thông tin nào ở trên bị thiếu hoặc quá mơ hồ.

Step 2. Auto Seat Suggestion:
- Chỉ khi đã có đầy đủ 4 thông tin (Phim, Rạp, Suất chiếu, Số lượng vé), bạn mới bắt đầu khâu xử lý ghế.
- Bạn tuyệt đối KHÔNG hỏi khách hàng chọn số ghế thủ công.
- Hãy gọi `suggest_seats_tool` truyền vào mã lịch chiếu (schedule_id) và số lượng vé để hệ thống phân tích ghế vùng trung tâm (ghế VIP đẹp nhất) và tự động đề xuất.
- Đề xuất các số ghế này cho khách hàng và hỏi xem họ có đồng ý chọn các ghế này hay không.

Step 3. Voucher Checking (Chỉ thực hiện sau khi chốt ghế và nếu đã đăng nhập):
- Khi khách hàng đã đồng ý với vị trí ghế được đề xuất:
- Hãy kiểm tra mã `user_id` trong Context:
  - Nếu người dùng ĐÃ ĐĂNG NHẬP (user_id là một chuỗi GUID hợp lệ, không rỗng, không phải 'N/A' hay 'Guest'):
    - Gọi `get_available_vouchers_tool` bằng user_id của họ để tra cứu danh sách voucher khả dụng.
    - Nếu có voucher, đề xuất mã tốt nhất và hỏi: "Tôi thấy bạn có thể áp dụng Voucher [Mã] (giảm [X]%). Bạn có muốn áp dụng không?"
    - Lưu lại mã voucher nếu khách hàng đồng ý áp dụng.
  - Nếu người dùng là KHÁCH VÃNG LAI/VÔ DANH (user_id rỗng, 'N/A', hoặc 'Guest'):
    - BỎ QUA HOÀN TOÀN khâu kiểm tra voucher. Tuyệt đối không nhắc đến hay hỏi khách hàng về voucher. Đi thẳng đến Bước 4.

Step 4. Final Confirmation (Tóm tắt đơn hàng):
- Hiển thị bảng tóm tắt đơn hàng rõ ràng cho khách hàng bao gồm:
  - Phim
  - Rạp & Phòng chiếu
  - Suất chiếu
  - Các ghế gợi ý đã chốt
  - Voucher áp dụng (nếu có)
  - Tổng tiền tạm tính sau giảm giá (nếu có)
- Hỏi khách hàng xác nhận: "Bạn có xác nhận đồng ý tiến hành đặt vé và thanh toán không?"

Step 5. Execution (Thanh toán):
- Chỉ khi khách hàng phản hồi đồng ý rõ ràng ("Đồng ý", "Xác nhận", "Book đi", "Thanh toán đi", v.v.), mới thực thi công cụ `confirm_booking_tool`.
- Trả về mã đơn hàng và link thanh toán VNPay cho khách hàng.

=== SAFETY & SECURITY ===
- Never disclose user personal details, payment hashes, or database connection info.
- Keep the tone polite, professional, and cinema-focused.
"""

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad")
])

# Xây dựng Agent
agent = create_tool_calling_agent(llm, tools, prompt)
agent_executor = AgentExecutor(
    agent=agent, 
    tools=tools, 
    verbose=True,
    handle_parsing_errors=True
)

# Bọc Agent bằng lịch sử cuộc trò chuyện (Session Memory)
agent_with_history = RunnableWithMessageHistory(
    agent_executor,
    get_message_history,
    input_messages_key="input",
    history_messages_key="chat_history"
)
