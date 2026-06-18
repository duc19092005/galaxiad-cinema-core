from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger
import uvicorn

from config import HOST, PORT, GOOGLE_API_KEY, EMBEDDING_MODEL
from models import (
    EmbedMoviesRequest, EmbedMoviesResponse,
    RecommendRequest, RecommendResponse, MovieScore,
    HealthResponse
)
from embedder import embedder


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("=" * 50)
    logger.info("Cinema AI Service starting...")
    logger.info(f"Embedding model: {EMBEDDING_MODEL}")
    if not GOOGLE_API_KEY:
        logger.warning("GOOGLE_API_KEY not set! Embedding calls will fail.")
    embedder.ensure_collection(retries=10, delay_seconds=2)
    logger.info("=" * 50)
    yield
    logger.info("Cinema AI Service shutting down...")


app = FastAPI(
    title="Cinema AI Service",
    description="Personalized movie recommendation using Google Gemini embeddings",
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


if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
