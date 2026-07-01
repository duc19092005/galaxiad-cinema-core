import hashlib
import time
from typing import Dict, List, Tuple

import httpx
import numpy as np
from loguru import logger
from qdrant_client import QdrantClient, models as qdrant_models

from config import (
    EMBEDDING_BACKEND,
    EMBEDDING_DIM,
    EMBEDDING_MODEL,
    JINA_API_KEY,
    QDRANT_API_KEY,
    QDRANT_COLLECTION,
    QDRANT_URL,
)


class MovieEmbedder:
    """
    Manages movie embeddings for vector generation and Qdrant persistent storage.
    Supports two backends:
    - local: BAAI/bge-m3 via SentenceTransformer (development)
    - cloud: Jina AI embeddings-v3 API (production)
    """

    def __init__(self):
        self.collection_name = QDRANT_COLLECTION
        self.client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY if QDRANT_API_KEY else None,
        )
        self._initialized = False
        self.model = None

        if EMBEDDING_BACKEND == "cloud":
            if not JINA_API_KEY:
                raise ValueError("JINA_API_KEY is required when EMBEDDING_BACKEND=cloud")
            logger.info("Embedding backend: cloud (Jina AI embeddings-v3)")
        else:
            from sentence_transformers import SentenceTransformer
            logger.info("=" * 50)
            logger.info("Initializing local SentenceTransformer model: {}", EMBEDDING_MODEL)
            logger.info("This may take some time on the first run to download the model.")
            self.model = SentenceTransformer(EMBEDDING_MODEL)
            logger.info("Local SentenceTransformer model loaded successfully.")
            logger.info("=" * 50)

    def ensure_collection(self, retries: int = 1, delay_seconds: float = 0.0) -> None:
        last_error: Exception | None = None

        for attempt in range(1, retries + 1):
            try:
                info = self.client.get_collection(collection_name=self.collection_name)
                
                # Verify vector size to prevent dimension mismatch crashes on transition
                try:
                    vectors_config = info.config.params.vectors
                    if isinstance(vectors_config, dict):
                        size = next(iter(vectors_config.values())).size
                    else:
                        size = vectors_config.size
                    
                    if size != EMBEDDING_DIM:
                        logger.warning(
                            "Qdrant collection dimension mismatch (found {}, expected {}). Re-creating collection...",
                            size,
                            EMBEDDING_DIM
                        )
                        self.client.delete_collection(collection_name=self.collection_name)
                        raise ValueError("Dimension mismatch")
                except Exception as shape_err:
                    if isinstance(shape_err, ValueError):
                        raise
                    logger.warning("Could not verify Qdrant vector size: {}", shape_err)

                self._initialized = True
                return
            except Exception as exc:
                last_error = exc
                try:
                    self.client.create_collection(
                        collection_name=self.collection_name,
                        vectors_config=qdrant_models.VectorParams(
                            size=EMBEDDING_DIM,
                            distance=qdrant_models.Distance.COSINE,
                        ),
                    )
                    self._initialized = True
                    logger.info("Created Qdrant collection {}", self.collection_name)
                    return
                except Exception as create_exc:
                    last_error = create_exc
                    logger.warning(
                        "Qdrant collection init attempt {}/{} failed: {}",
                        attempt,
                        retries,
                        create_exc,
                    )
                    if attempt < retries and delay_seconds > 0:
                        time.sleep(delay_seconds)

        raise RuntimeError(f"Could not initialize Qdrant collection: {last_error}")

    def _ensure_ready(self) -> None:
        if not self._initialized:
            self.ensure_collection()

    def _embed_text(self, text: str) -> List[float]:
        """Embed text using the configured backend (local or cloud)."""
        if EMBEDDING_BACKEND == "cloud":
            return self._embed_text_cloud(text)
        return self._embed_text_local(text)

    def _embed_text_local(self, text: str) -> List[float]:
        """Embed via local SentenceTransformer model."""
        vector = self.model.encode(text, normalize_embeddings=True)
        return vector.astype(float).tolist()

    def _embed_text_cloud(self, text: str) -> List[float]:
        """Embed via Jina AI embeddings-v3 cloud API."""
        response = httpx.post(
            "https://api.jina.ai/v1/embeddings",
            headers={
                "Authorization": f"Bearer {JINA_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "jina-embeddings-v3",
                "input": [text],
                "dimensions": EMBEDDING_DIM,
            },
            timeout=30.0,
        )
        response.raise_for_status()
        data = response.json()
        embedding = data["data"][0]["embedding"]
        # Normalize to unit vector (same as local model)
        vec = np.array(embedding, dtype=float)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    @staticmethod
    def _content_hash(text: str) -> str:
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    def embed_movies(self, movies: List[Tuple[str, str]]) -> int:
        """
        Embed and upsert movies into Qdrant.
        Args:
            movies: List of (movie_id, embedding_text) tuples
        Returns:
            Number of successfully embedded/upserted movies
        """
        self._ensure_ready()

        existing_hashes = self._load_existing_hashes()
        points: List[qdrant_models.PointStruct] = []
        for movie_id, text in movies:
            try:
                movie_id_lower = movie_id.lower()
                content_hash = self._content_hash(text)
                if existing_hashes.get(movie_id_lower) == content_hash:
                    logger.info("Skipped unchanged movie {}", movie_id_lower)
                    continue

                points.append(
                    qdrant_models.PointStruct(
                        id=movie_id_lower,
                        vector=self._embed_text(text),
                        payload={
                            "movie_id": movie_id_lower,
                            "content_hash": content_hash,
                        },
                    )
                )
                logger.info("Embedded movie {}", movie_id_lower)
            except Exception as exc:
                logger.error("Failed to embed movie {}: {}", movie_id, exc)

        if not points:
            return 0

        self.client.upsert(
            collection_name=self.collection_name,
            wait=True,
            points=points,
        )
        return len(points)

    def sync_movies(self, movies: List[Tuple[str, str]]) -> Tuple[int, int, int]:
        """
        Reconcile Qdrant with the active/coming-soon movie snapshot from SQL.
        Returns:
            (embedded_count, deleted_count, skipped_count)
        """
        self._ensure_ready()

        existing_hashes = self._load_existing_hashes()
        active_ids = {movie_id.lower() for movie_id, _ in movies}
        to_embed: List[Tuple[str, str]] = []
        skipped_count = 0

        for movie_id, text in movies:
            movie_id_lower = movie_id.lower()
            content_hash = self._content_hash(text)
            if existing_hashes.get(movie_id_lower) == content_hash:
                skipped_count += 1
                continue
            to_embed.append((movie_id_lower, text))

        embedded_count = self.embed_movies(to_embed) if to_embed else 0

        stale_ids = sorted(set(existing_hashes.keys()) - active_ids)
        deleted_count = self.delete_movies(stale_ids) if stale_ids else 0

        return embedded_count, deleted_count, skipped_count

    def delete_movie(self, movie_id: str) -> bool:
        return self.delete_movies([movie_id.lower()]) > 0

    def delete_movies(self, movie_ids: List[str]) -> int:
        self._ensure_ready()
        if not movie_ids:
            return 0

        lower_ids = [m.lower() for m in movie_ids]
        self.client.delete(
            collection_name=self.collection_name,
            wait=True,
            points_selector=qdrant_models.PointIdsList(points=lower_ids),
        )
        logger.info("Deleted {} movie vectors from Qdrant", len(lower_ids))
        return len(lower_ids)

    def search(self, user_text: str, top_k: int = 5, exclude_ids: list[str] | None = None) -> List[Tuple[str, float]]:
        self._ensure_ready()
        if self.movie_count == 0:
            logger.warning("No movies embedded yet")
            return []

        query_vector = self._embed_text(user_text)

        exclude = exclude_ids or []
        search_result = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            limit=top_k + len(exclude),  # fetch extra to account for excludes
            with_payload=True,
        ).points

        results: List[Tuple[str, float]] = []
        exclude_lower = [e.lower() for e in exclude]
        for point in search_result:
            movie_id = str(point.payload.get("movie_id", point.id).lower() if point.payload else str(point.id).lower())
            if movie_id in exclude_lower:
                continue
            # Qdrant score = cosine similarity (1 = identical, 0 = orthogonal)
            similarity = float(point.score)
            results.append((movie_id, similarity))
            if len(results) >= top_k:
                break

        return results

    def search_by_id(self, movie_id: str, top_k: int = 5, exclude_ids: list[str] | None = None) -> List[Tuple[str, float]]:
        """
        Find movies similar to a given movie by using its OWN vector from Qdrant.
        This is the CORRECT way to do movie-to-movie similarity — no manual mapping needed.

        Flow:
        1. Fetch the movie's point (with vector) from Qdrant by movie_id
        2. Use that vector as query to find nearest neighbors
        3. Return top-k results (excluding the source movie_id)
        """
        self._ensure_ready()
        if self.movie_count == 0:
            logger.warning("No movies embedded yet")
            return []

        movie_id_lower = movie_id.lower()

        # Step 1: Fetch the movie's point with its vector
        points, _ = self.client.scroll(
            collection_name=self.collection_name,
            limit=1,
            with_payload=False,
            with_vectors=True,
            scroll_filter=qdrant_models.Filter(
                must=[
                    qdrant_models.FieldCondition(
                        key="movie_id",
                        match=qdrant_models.MatchValue(value=movie_id_lower),
                    )
                ]
            ),
        )

        if not points or len(points) == 0:
            logger.warning(f"Movie {movie_id_lower} not found in Qdrant")
            return []

        movie_vector = points[0].vector
        if not movie_vector:
            logger.warning(f"Movie {movie_id_lower} has no vector in Qdrant")
            return []

        # Step 2: Use the movie's own vector to find similar movies
        exclude = [movie_id_lower]
        if exclude_ids:
            exclude.extend([e.lower() for e in exclude_ids])
        exclude = list(set(exclude))

        search_result = self.client.query_points(
            collection_name=self.collection_name,
            query=movie_vector,
            limit=top_k + len(exclude),  # fetch extra to account for excludes
            with_payload=True,
        ).points

        results: List[Tuple[str, float]] = []
        for point in search_result:
            point_id = str(point.payload.get("movie_id", point.id).lower() if point.payload else str(point.id).lower())
            if point_id in exclude:
                continue
            # Qdrant score = cosine similarity (1 = identical, 0 = orthogonal)
            similarity = float(point.score)
            results.append((point_id, similarity))
            if len(results) >= top_k:
                break

        return results

    def _load_existing_hashes(self) -> Dict[str, str]:
        hashes: Dict[str, str] = {}
        next_offset = None

        while True:
            points, next_offset = self.client.scroll(
                collection_name=self.collection_name,
                limit=100,
                offset=next_offset,
                with_payload=True,
                with_vectors=False,
            )

            for point in points:
                payload = point.payload or {}
                movie_id = str(payload.get("movie_id", point.id)).lower()
                content_hash = payload.get("content_hash")
                hashes[movie_id] = str(content_hash) if content_hash else ""

            if next_offset is None:
                return hashes

    @property
    def movie_count(self) -> int:
        self._ensure_ready()
        return int(
            self.client.count(
                collection_name=self.collection_name,
                exact=True,
            ).count
        )


embedder = MovieEmbedder()
