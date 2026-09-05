import redis
from loguru import logger
from langchain_openai import ChatOpenAI
from langchain_classic.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.chat_history import InMemoryChatMessageHistory, BaseChatMessageHistory
from langchain_community.chat_message_histories import RedisChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

from config import (
    DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL,
    DEEPSEEK_MODEL,
    REDIS_HOST,
    REDIS_PORT,
    REDIS_PASSWORD,
)
from core.prompts import AGENT_SYSTEM_PROMPT_TEMPLATE
from core.tools import (
    confirm_booking_tool,
    get_available_vouchers_tool,
    get_pricing_tool,
    get_seat_map_tool,
    list_active_cinemas_tool,
    list_nearest_cinemas_tool,
    list_active_movies_tool,
    list_genres_tool,
    list_schedule_dates_tool,
    search_showtimes_tool,
    suggest_seats_tool,
)

_in_memory_histories = {}


def get_message_history(session_id: str) -> BaseChatMessageHistory:
    """
    Load conversation memory from Redis with a 30 minute TTL.
    If Redis is unavailable, fall back to in-memory storage.
    """
    if not session_id or session_id.strip() == "":
        return InMemoryChatMessageHistory()

    redis_key = f"cinema:chat:session:{session_id}"
    try:
        redis_client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            password=REDIS_PASSWORD or None,
            socket_timeout=1.0,
        )
        redis_client.ping()
        redis_url = (
            f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}"
            if REDIS_PASSWORD
            else f"redis://{REDIS_HOST}:{REDIS_PORT}"
        )
        return RedisChatMessageHistory(
            session_id=redis_key,
            url=redis_url,
            ttl=1800,
        )
    except Exception as exc:
        logger.warning(f"Redis memory client disconnected. Fallback to in-memory: {exc}")
        if session_id not in _in_memory_histories:
            _in_memory_histories[session_id] = InMemoryChatMessageHistory()
        return _in_memory_histories[session_id]


llm = ChatOpenAI(
    api_key=DEEPSEEK_API_KEY or "sk-dummy-test-key-for-testing",
    base_url=DEEPSEEK_BASE_URL,
    model=DEEPSEEK_MODEL,
    temperature=0.2,
)

tools = [
    list_active_movies_tool,
    list_active_cinemas_tool,
    list_nearest_cinemas_tool,
    list_genres_tool,
    list_schedule_dates_tool,
    search_showtimes_tool,
    get_pricing_tool,
    get_seat_map_tool,
    get_available_vouchers_tool,
    suggest_seats_tool,
    confirm_booking_tool,
]

prompt = ChatPromptTemplate.from_messages([
    ("system", AGENT_SYSTEM_PROMPT_TEMPLATE),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

agent = create_tool_calling_agent(llm, tools, prompt)
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    handle_parsing_errors=True,
)

agent_with_history = RunnableWithMessageHistory(
    agent_executor,
    get_message_history,
    input_messages_key="input",
    history_messages_key="chat_history",
)
