import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger
import uvicorn

# Ensure this directory is on path so absolute imports work in Docker
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import HOST, PORT, EMBEDDING_MODEL, GOOGLE_API_KEY
from core.embedder import embedder
from core.llm_client import init_deepseek_client, close_deepseek_client

# Import routers
from routes import (
    health,
    embedding,
    recommendations,
    guard,
    classification,
    moderation,
    chat
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("=" * 50)
    logger.info("Cinema AI Service starting (Refactored)...")
    logger.info(f"Embedding model: {EMBEDDING_MODEL}")
    
    if "models/text-embedding" in EMBEDDING_MODEL and not GOOGLE_API_KEY:
        logger.warning("GOOGLE_API_KEY not set! Gemini embedding calls will fail.")
        
    # Ensure Qdrant collection is ready
    embedder.ensure_collection(retries=10, delay_seconds=2)

    # Initialize global deepseek httpx client
    init_deepseek_client()
    
    logger.info("=" * 50)
    yield
    # Close global deepseek httpx client
    await close_deepseek_client()
    logger.info("Cinema AI Service shutting down...")

app = FastAPI(
    title="Cinema AI Service",
    description="Personalized movie recommendation using Google Gemini embeddings and DeepSeek agentic logic",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(embedding.router, tags=["Embedding"])
app.include_router(recommendations.router, tags=["Recommendations"])
app.include_router(guard.router, tags=["Guard"])
app.include_router(classification.router, tags=["Classification"])
app.include_router(moderation.router, tags=["Moderation"])
app.include_router(chat.router, tags=["Chat"])

if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
