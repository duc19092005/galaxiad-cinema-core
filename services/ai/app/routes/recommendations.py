from fastapi import APIRouter, HTTPException
from loguru import logger
from models import RecommendRequest, RecommendByIdRequest, RecommendResponse, MovieScore
from core.embedder import embedder

router = APIRouter()

@router.post("/recommend", response_model=RecommendResponse)
async def recommend(request: RecommendRequest):
    """
    Given user preference text, find top-k most similar movies.
    Uses cosine similarity via Qdrant vector search.
    """
    if embedder.movie_count == 0:
        logger.warning("No movies embedded yet. Returning empty results.")
        return RecommendResponse(results=[])

    if not request.user_text or len(request.user_text.strip()) < 5:
        raise HTTPException(status_code=400, detail="user_text is too short")

    logger.info(f"Finding top {request.top_k} movies for: {request.user_text[:80]}...")

    try:
        results = embedder.search(request.user_text, top_k=request.top_k, exclude_ids=request.exclude_ids)
        movie_scores = [
            MovieScore(movie_id=movie_id, distance=distance)
            for movie_id, distance in results
        ]
        logger.info(f"Returning {len(movie_scores)} recommendations")
        return RecommendResponse(results=movie_scores)
    except Exception as e:
        logger.error(f"Error during recommendation: {e}")
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")

@router.post("/recommend-by-id", response_model=RecommendResponse)
async def recommend_by_id(request: RecommendByIdRequest):
    """
    Find movies similar to a given movie by using its OWN vector from Qdrant.
    """
    if embedder.movie_count == 0:
        logger.warning("No movies embedded yet. Returning empty results.")
        return RecommendResponse(results=[])

    if not request.movie_id:
        raise HTTPException(status_code=400, detail="movie_id is required")

    movie_id_lower = request.movie_id.lower()
    logger.info(f"Finding movies similar to movie_id={movie_id_lower}, top_k={request.top_k}")

    try:
        # Build exclude list — always exclude the source movie itself
        exclude = [movie_id_lower]
        if request.exclude_ids:
            exclude.extend([e.lower() for e in request.exclude_ids])
        exclude = list(set(exclude))

        results = embedder.search_by_id(movie_id_lower, top_k=request.top_k, exclude_ids=exclude)
        movie_scores = [
            MovieScore(movie_id=movie_id, distance=distance)
            for movie_id, distance in results
        ]
        logger.info(f"Returning {len(movie_scores)} movies similar to {movie_id_lower}")
        return RecommendResponse(results=movie_scores)
    except Exception as e:
        logger.error(f"Error during recommend-by-id: {e}")
        raise HTTPException(status_code=500, detail=f"Recommend by ID failed: {str(e)}")
