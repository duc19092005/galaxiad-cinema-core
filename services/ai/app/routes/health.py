from fastapi import APIRouter
from core.embedder import embedder
from models import HealthResponse
from config import EMBEDDING_MODEL

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        embedded_movies_count=embedder.movie_count,
        model=EMBEDDING_MODEL
    )
