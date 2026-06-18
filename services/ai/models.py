from pydantic import BaseModel
from typing import List


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
