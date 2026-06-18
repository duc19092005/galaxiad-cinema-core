import hashlib
import time
from typing import Dict, List, Tuple

import google.generativeai as genai
import numpy as np
from loguru import logger
from qdrant_client import QdrantClient, models as qdrant_models

from config import (
    EMBEDDING_DIM,
    EMBEDDING_MODEL,
    GOOGLE_API_KEY,
    QDRANT_COLLECTION,
    QDRANT_URL,
)


genai.configure(api_key=GOOGLE_API_KEY)


class MovieEmbedder:
    """
    Manages movie embeddings using Gemini for vector generation and Qdrant for
    persistent vector storage/search.
    """

    def __init__(self):
        self.collection_name = QDRANT_COLLECTION
        self.client = QdrantClient(url=QDRANT_URL)
        self._initialized = False

    def ensure_collection(self, retries: int = 1, delay_seconds: float = 0.0) -> None:
        last_error: Exception | None = None

        for attempt in range(1, retries + 1):
            try:
                self.client.get_collection(collection_name=self.collection_name)
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
        """Call Gemini Embedding API and return an L2-normalized vector."""
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text,
            task_type="SEMANTIC_SIMILARITY",
        )
        vector = np.array(result["embedding"], dtype=np.float32)
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        return vector.astype(float).tolist()

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
                content_hash = self._content_hash(text)
                if existing_hashes.get(movie_id) == content_hash:
                    logger.info("Skipped unchanged movie {}", movie_id)
                    continue

                points.append(
                    qdrant_models.PointStruct(
                        id=movie_id,
                        vector=self._embed_text(text),
                        payload={
                            "movie_id": movie_id,
                            "content_hash": content_hash,
                        },
                    )
                )
                logger.info("Embedded movie {}", movie_id)
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
        active_ids = {movie_id for movie_id, _ in movies}
        to_embed: List[Tuple[str, str]] = []
        skipped_count = 0

        for movie_id, text in movies:
            content_hash = self._content_hash(text)
            if existing_hashes.get(movie_id) == content_hash:
                skipped_count += 1
                continue
            to_embed.append((movie_id, text))

        embedded_count = self.embed_movies(to_embed) if to_embed else 0

        stale_ids = sorted(set(existing_hashes.keys()) - active_ids)
        deleted_count = self.delete_movies(stale_ids) if stale_ids else 0

        return embedded_count, deleted_count, skipped_count

    def delete_movie(self, movie_id: str) -> bool:
        return self.delete_movies([movie_id]) > 0

    def delete_movies(self, movie_ids: List[str]) -> int:
        self._ensure_ready()
        if not movie_ids:
            return 0

        self.client.delete(
            collection_name=self.collection_name,
            wait=True,
            points_selector=qdrant_models.PointIdsList(points=movie_ids),
        )
        logger.info("Deleted {} movie vectors from Qdrant", len(movie_ids))
        return len(movie_ids)

    def search(self, user_text: str, top_k: int = 5) -> List[Tuple[str, float]]:
        self._ensure_ready()
        if self.movie_count == 0:
            logger.warning("No movies embedded yet")
            return []

        query_vector = self._embed_text(user_text)
        search_result = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            limit=top_k,
            with_payload=True,
        ).points

        return [
            (
                str(point.payload.get("movie_id", point.id) if point.payload else point.id),
                float(1.0 - point.score),
            )
            for point in search_result
        ]

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
                movie_id = str(payload.get("movie_id", point.id))
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
