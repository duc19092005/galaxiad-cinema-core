import numpy as np
from typing import List, Tuple, Optional
from loguru import logger
import google.generativeai as genai
from config import GOOGLE_API_KEY, EMBEDDING_MODEL, EMBEDDING_DIM


genai.configure(api_key=GOOGLE_API_KEY)


class MovieEmbedder:
    """
    Manages movie embeddings using Google Gemini text-embedding-004.
    Stores all embeddings in-memory as numpy arrays.
    Uses L2 normalization + Euclidean distance for similarity search.

    Why L2 norm + Euclidean == Cosine similarity:
        When vectors are L2-normalized (unit norm), Euclidean distance
        d(u,v) = sqrt(2 - 2*cos(u,v)), so min Euclidean = max cosine.
    """

    def __init__(self):
        self._movie_ids: List[str] = []
        self._embeddings: Optional[np.ndarray] = None  # shape: (N, EMBEDDING_DIM)

    def _embed_text(self, text: str) -> np.ndarray:
        """Call Google Gemini Embedding API and return L2-normalized vector."""
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text,
            task_type="SEMANTIC_SIMILARITY"
        )
        vector = np.array(result["embedding"], dtype=np.float32)
        # L2 normalize: vector / ||vector||_2
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        return vector

    def embed_movies(self, movies: List[Tuple[str, str]]) -> int:
        """
        Embed a list of movies and store their normalized vectors.
        Args:
            movies: List of (movie_id, embedding_text) tuples
        Returns:
            Number of successfully embedded movies
        """
        new_ids = []
        new_vectors = []

        for movie_id, text in movies:
            try:
                vector = self._embed_text(text)
                new_ids.append(movie_id)
                new_vectors.append(vector)
                logger.info(f"Embedded movie {movie_id}")
            except Exception as e:
                logger.error(f"Failed to embed movie {movie_id}: {e}")

        if not new_vectors:
            return 0

        new_matrix = np.array(new_vectors, dtype=np.float32)  # (M, DIM)

        # Rebuild full index: replace existing if movie_id already present
        existing_map = {mid: i for i, mid in enumerate(self._movie_ids)}
        
        if self._embeddings is None:
            self._movie_ids = new_ids
            self._embeddings = new_matrix
        else:
            for i, mid in enumerate(new_ids):
                if mid in existing_map:
                    # Update existing
                    self._embeddings[existing_map[mid]] = new_matrix[i]
                else:
                    # Append new
                    self._movie_ids.append(mid)
                    self._embeddings = np.vstack([self._embeddings, new_matrix[i:i+1]])

        return len(new_vectors)

    def search(self, user_text: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """
        Embed user preference text and find top-k most similar movies.
        Uses Euclidean distance on L2-normalized vectors.

        Args:
            user_text: User preference description
            top_k: Number of results to return
        Returns:
            List of (movie_id, euclidean_distance) sorted ascending (closest first)
        """
        if self._embeddings is None or len(self._movie_ids) == 0:
            logger.warning("No movies embedded yet")
            return []

        # Embed and normalize user query
        user_vector = self._embed_text(user_text)  # already L2-normalized

        # Euclidean distance: sqrt(sum((a-b)^2))
        # Since both vectors are L2-normalized:
        # ||u - v||^2 = ||u||^2 + ||v||^2 - 2*(u·v) = 2 - 2*(u·v)
        # We can compute efficiently via: diff = embeddings - user_vector, dist = norm(diff, axis=1)
        diff = self._embeddings - user_vector  # (N, DIM)
        distances = np.linalg.norm(diff, axis=1)  # (N,)

        # Get top-k indices sorted by distance (ascending = most similar first)
        k = min(top_k, len(self._movie_ids))
        top_indices = np.argpartition(distances, k)[:k]
        top_indices = top_indices[np.argsort(distances[top_indices])]

        results = [
            (self._movie_ids[i], float(distances[i]))
            for i in top_indices
        ]
        return results

    @property
    def movie_count(self) -> int:
        return len(self._movie_ids)


# Global singleton instance
embedder = MovieEmbedder()
