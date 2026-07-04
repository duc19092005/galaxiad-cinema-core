from fastapi import APIRouter, HTTPException
from loguru import logger
from models import EmbedMoviesRequest, EmbedMoviesResponse
from core.embedder import embedder

router = APIRouter()

@router.post("/embed-movies", response_model=EmbedMoviesResponse)
async def embed_movies(request: EmbedMoviesRequest):
    """
    Receive a list of movies from C# backend and embed them using Google Gemini.
    Stores embeddings in Qdrant for persistent similarity search.
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

@router.delete("/embed-movies/{movie_id}", response_model=EmbedMoviesResponse)
async def delete_movie_embedding(movie_id: str):
    """Delete a movie vector from Qdrant when the movie is no longer recommendable."""
    deleted = embedder.delete_movie(movie_id)
    return EmbedMoviesResponse(
        success=True,
        embedded_count=0,
        deleted_count=1 if deleted else 0,
        message=f"Deleted embedding for movie {movie_id}"
    )

@router.post("/sync-movies", response_model=EmbedMoviesResponse)
async def sync_movies(request: EmbedMoviesRequest):
    """
    Reconcile Qdrant with the active/coming-soon movie snapshot from C# backend.
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
