from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class MovieItem(BaseModel):
    movie_id: str
    embedding_text: str  # "Tên phim: X. Thể loại: Y. Mô tả: Z. Đạo diễn: A. Diễn viên: B"


class EmbedMoviesRequest(BaseModel):
    movies: List[MovieItem]


class EmbedMoviesResponse(BaseModel):
    success: bool
    embedded_count: int
    deleted_count: int = 0
    skipped_count: int = 0
    message: str


class RecommendRequest(BaseModel):
    user_text: str  # "Người dùng thích thể loại: Hành động, Sci-Fi. Thích phim phức tạp"
    top_k: int = 5


class MovieScore(BaseModel):
    movie_id: str
    distance: float


class RecommendResponse(BaseModel):
    results: List[MovieScore]


class HealthResponse(BaseModel):
    status: str
    embedded_movies_count: int
    model: str
    vector_store: str = "qdrant"


class ClassifyIntentRequest(BaseModel):
    message: str


class ClassifyIntentResponse(BaseModel):
    intent: str
    parameters: Dict[str, str]


class ChatLlmRequest(BaseModel):
    user_prompt: str
    tool_context: Optional[str] = ""
    user_role: Optional[str] = ""
    user_id: Optional[str] = ""
    language: Optional[str] = "vi"


class ChatLlmResponse(BaseModel):
    response: str


class ModerationRequest(BaseModel):
    content: str


class ModerationResponse(BaseModel):
    blocked: bool
    reason: str


class GuardRequest(BaseModel):
    message: str
    user_role: Optional[str] = "Guest"
    language: Optional[str] = "vi"


class GuardResponse(BaseModel):
    is_blocked: bool
    reason: str  # Thông báo tiếng Việt lịch sự khi bị block, hoặc '' khi pass
