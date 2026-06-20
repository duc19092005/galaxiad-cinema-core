from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger
import uvicorn
import httpx
import json
import re
from datetime import datetime

from config import HOST, PORT, GOOGLE_API_KEY, EMBEDDING_MODEL, DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
from models import (
    EmbedMoviesRequest, EmbedMoviesResponse,
    RecommendRequest, RecommendResponse, MovieScore,
    HealthResponse, ClassifyIntentRequest, ClassifyIntentResponse,
    ChatLlmRequest, ChatLlmResponse, ModerationRequest, ModerationResponse
)
from embedder import embedder

# Global HTTP client for DeepSeek connection reuse
deepseek_client = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    global deepseek_client
    logger.info("=" * 50)
    logger.info("Cinema AI Service starting...")
    logger.info(f"Embedding model: {EMBEDDING_MODEL}")
    if not GOOGLE_API_KEY:
        logger.warning("GOOGLE_API_KEY not set! Embedding calls will fail.")
    embedder.ensure_collection(retries=10, delay_seconds=2)
    
    # Initialize HTTP client
    deepseek_client = httpx.AsyncClient(timeout=30.0)
    logger.info("DeepSeek HTTP AsyncClient initialized.")
    logger.info("=" * 50)
    yield
    if deepseek_client:
        await deepseek_client.aclose()
        logger.info("DeepSeek HTTP AsyncClient closed.")
    logger.info("Cinema AI Service shutting down...")


app = FastAPI(
    title="Cinema AI Service",
    description="Personalized movie recommendation using Google Gemini embeddings and DeepSeek agentic logic",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        embedded_movies_count=embedder.movie_count,
        model=EMBEDDING_MODEL
    )


@app.post("/embed-movies", response_model=EmbedMoviesResponse)
async def embed_movies(request: EmbedMoviesRequest):
    """
    Receive a list of movies from C# backend and embed them using Google Gemini.
    Stores embeddings in Qdrant for persistent similarity search.

    Called by C# backend:
    - On startup (sync all active/coming-soon movies)
    - When a new movie is added
    """
    if not request.movies:
        raise HTTPException(status_code=400, detail="Movies list is empty")

    logger.info(f"Received {len(request.movies)} movies to embed")

    movies_tuples = [(m.movie_id, m.embedding_text) for m in request.movies]
    embedded_count = embedder.embed_movies(movies_tuples)

    logger.info(f"Successfully embedded {embedded_count}/{len(request.movies)} movies")
    logger.info(f"Total movies in index: {embedder.movie_count}")

    return EmbedMoviesResponse(
        success=embedded_count > 0 or len(request.movies) > 0,
        embedded_count=embedded_count,
        skipped_count=max(0, len(request.movies) - embedded_count),
        message=f"Đã embedding {embedded_count}/{len(request.movies)} phim. Tổng: {embedder.movie_count}"
    )


@app.delete("/embed-movies/{movie_id}", response_model=EmbedMoviesResponse)
async def delete_movie_embedding(movie_id: str):
    """Delete a movie vector from Qdrant when the movie is no longer recommendable."""
    deleted = embedder.delete_movie(movie_id)
    return EmbedMoviesResponse(
        success=True,
        embedded_count=0,
        deleted_count=1 if deleted else 0,
        message=f"Deleted embedding for movie {movie_id}"
    )


@app.post("/sync-movies", response_model=EmbedMoviesResponse)
async def sync_movies(request: EmbedMoviesRequest):
    """
    Reconcile Qdrant with the active/coming-soon movie snapshot from C# backend.
    Only changed/new movies are re-embedded; stale vectors are deleted.
    """
    movies_tuples = [(m.movie_id, m.embedding_text) for m in request.movies]
    embedded_count, deleted_count, skipped_count = embedder.sync_movies(movies_tuples)

    return EmbedMoviesResponse(
        success=True,
        embedded_count=embedded_count,
        deleted_count=deleted_count,
        skipped_count=skipped_count,
        message=(
            f"Synced movies. embedded={embedded_count}, "
            f"deleted={deleted_count}, skipped={skipped_count}, total={embedder.movie_count}"
        )
    )


@app.post("/recommend", response_model=RecommendResponse)
async def recommend(request: RecommendRequest):
    """
    Given user preference text, find top-k most similar movies.
    Uses L2-normalized Euclidean distance search.

    Flow:
    1. Embed user_text using Google Gemini
    2. L2 normalize the vector
    3. Compute Euclidean distance to all movie vectors
    4. Return top-k closest movies (smallest distance = most similar)
    """
    if embedder.movie_count == 0:
        logger.warning("No movies embedded yet. Returning empty results.")
        return RecommendResponse(results=[])

    if not request.user_text or len(request.user_text.strip()) < 5:
        raise HTTPException(status_code=400, detail="user_text is too short")

    logger.info(f"Finding top {request.top_k} movies for: {request.user_text[:80]}...")

    try:
        results = embedder.search(request.user_text, top_k=request.top_k)
        movie_scores = [
            MovieScore(movie_id=movie_id, distance=distance)
            for movie_id, distance in results
        ]
        logger.info(f"Returning {len(movie_scores)} recommendations")
        return RecommendResponse(results=movie_scores)
    except Exception as e:
        logger.error(f"Error during recommendation: {e}")
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")


async def call_deepseek(system_prompt: str, user_prompt: str, temperature: float = 0.2) -> str:
    """Helper function to perform direct async completions with DeepSeek API."""
    if not DEEPSEEK_API_KEY:
        logger.error("DEEPSEEK_API_KEY is not configured.")
        raise HTTPException(status_code=500, detail="DeepSeek API key is not configured.")

    url = f"{DEEPSEEK_BASE_URL}/chat/completions"
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": DEEPSEEK_MODEL,
        "temperature": temperature,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    }

    try:
        client = deepseek_client if deepseek_client else httpx.AsyncClient(timeout=30.0)
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        res_json = response.json()
        content = res_json["choices"][0]["message"]["content"]
        return content or ""
    except Exception as e:
        logger.error(f"Error calling DeepSeek API: {e}")
        raise HTTPException(status_code=500, detail=f"DeepSeek call failed: {str(e)}")


@app.post("/classify-intent", response_model=ClassifyIntentResponse)
async def classify_intent(request: ClassifyIntentRequest):
    """
    Classify user message into predefined Cinema intents and extract variables.
    Delegates to DeepSeek LLM for structuring intent detection.
    """
    today_str = datetime.now().strftime("%Y-%m-%d")
    system_prompt = f"""Bạn là một AI chuyên phân loại ý định (Intent Classifier) cho hệ thống chatbot của rạp chiếu phim Galaxiad Cinema.
Nhiệm vụ của bạn là phân tích câu hỏi của người dùng và trả về kết quả dưới định dạng JSON duy nhất. KHÔNG giải thích, KHÔNG thêm ký tự khác ngoài JSON.

Danh sách các ý định (Intents) hỗ trợ:
1. "GetMovies": Khi người dùng muốn xem danh sách phim, tìm phim đang chiếu, phim sắp chiếu, hoặc hỏi xem rạp đang có những phim nào.
2. "GetShowtimes": Khi người dùng hỏi về lịch chiếu, suất chiếu, thời gian chiếu của phim hoặc tại cụm rạp nào đó.
   - Các tham số có thể trích xuất (nếu có):
     * "movieId": ID hoặc tên bộ phim đề cập (nếu họ chỉ nhắc đến tên phim, hãy cố gắng điền tên phim vào tham số này nếu không phân giải được ID).
     * "cinemaId": ID hoặc tên cụm rạp đề cập (nếu họ chỉ nhắc tên rạp, hãy điền tên rạp vào tham số này).
     * "date": Ngày muốn xem lịch chiếu (định dạng yyyy-MM-dd, mặc định là ngày hôm nay nếu không nhắc đến).
     * "city": Tên thành phố được nhắc đến (ví dụ: "Hồ Chí Minh", "Hà Nội").
3. "GetMyBookings": Khi người dùng muốn xem danh sách vé đã mua, lịch sử đặt vé, hoặc kiểm tra giao dịch đặt vé của chính họ.
4. "GetCinemaStatistics": Khi người quản lý (Manager) hoặc quản trị viên (Admin) muốn xem báo cáo thống kê, doanh thu rạp phim, số lượng vé bán ra, số lượng phim hoạt động.
5. "GetSystemAuditLogs": Khi Admin muốn xem nhật ký hoạt động hệ thống (Audit Logs), theo dõi các thao tác của nhân viên.
   - Các tham số trích xuất:
     * "limit": Số lượng bản ghi nhật ký (mặc định "15" nếu không chỉ định).
6. "GeneralFAQ": Chào hỏi, cảm ơn, hỏi chính sách chung (ví dụ: hoàn vé, quy định độ tuổi), hoặc bất kỳ câu hỏi thông thường nào không khớp với các công cụ trên.

YÊU CẦU:
Trả về định dạng JSON chính xác như sau:
{{
  "Intent": "GetMovies",
  "Parameters": {{
    "movieId": "",
    "cinemaId": "",
    "date": "{today_str}",
    "city": "",
    "limit": ""
  }}
}}
Tất cả các tham số không có thông tin phải để trống "".
"""

    response_text = await call_deepseek(system_prompt, request.message, temperature=0.2)

    try:
        match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if match:
            json_data = json.loads(match.group(0))
        else:
            json_data = json.loads(response_text)

        intent = json_data.get("Intent", "GeneralFAQ")
        parameters = json_data.get("Parameters", {})

        parameters_str = {}
        if isinstance(parameters, dict):
            for k, v in parameters.items():
                parameters_str[k] = str(v) if v is not None else ""

        valid_intents = {"GetMovies", "GetShowtimes", "GetMyBookings", "GetCinemaStatistics", "GetSystemAuditLogs", "GeneralFAQ"}
        if intent not in valid_intents:
            intent = "GeneralFAQ"

        return ClassifyIntentResponse(intent=intent, parameters=parameters_str)
    except Exception as e:
        logger.error(f"Error parsing intent classifier response: {e}. Raw text: {response_text}")
        return ClassifyIntentResponse(intent="GeneralFAQ", parameters={})


@app.post("/chat", response_model=ChatLlmResponse)
async def chat_llm(request: ChatLlmRequest):
    """Generic text completion endpoint for chatbot response generation."""
    response_text = await call_deepseek(request.system_prompt, request.user_prompt, temperature=0.2)
    return ChatLlmResponse(response=response_text)


@app.post("/moderate", response_model=ModerationResponse)
async def moderate_comment(request: ModerationRequest):
    """Moderate user comment content to filter out severe toxicity."""
    system_prompt = "You moderate Vietnamese cinema comments. Return only JSON: {\"blocked\":true|false,\"reason\":\"short Vietnamese reason\"}. Block only severe insults, hate, threats, sexual harassment, or abusive profanity. Do not block normal negative movie opinions."
    response_text = await call_deepseek(system_prompt, request.content, temperature=0.0)

    try:
        match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if match:
            json_data = json.loads(match.group(0))
        else:
            json_data = json.loads(response_text)

        blocked = bool(json_data.get("blocked", False))
        reason = str(json_data.get("reason", "Bình luận vi phạm tiêu chuẩn cộng đồng."))
        return ModerationResponse(blocked=blocked, reason=reason)
    except Exception as e:
        logger.error(f"Error parsing moderation response: {e}. Raw text: {response_text}")
        return ModerationResponse(blocked=False, reason="Moderation parsing failed.")


if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)

