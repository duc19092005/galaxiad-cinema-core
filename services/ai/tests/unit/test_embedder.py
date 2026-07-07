import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import hashlib


class TestMovieEmbedder:
    """Tests for MovieEmbedder class."""

    @pytest.fixture
    def embedder(self):
        with patch('app.core.embedder.SentenceTransformer'), \
             patch('app.core.embedder.QdrantClient'):
            from app.core.embedder import MovieEmbedder
            return MovieEmbedder()

    def test_content_hash_generation(self, embedder, sample_movies):
        """Test that content hash is deterministic."""
        movie = sample_movies[0]
        content = f"{movie['title']} {movie['description']} {' '.join(movie['genres'])}"
        hash1 = hashlib.sha256(content.encode()).hexdigest()
        hash2 = hashlib.sha256(content.encode()).hexdigest()
        assert hash1 == hash2

    def test_content_hash_different_for_different_movies(self, embedder, sample_movies):
        """Test that different movies produce different hashes."""
        movie1 = sample_movies[0]
        movie2 = sample_movies[1]
        content1 = f"{movie1['title']} {movie1['description']} {' '.join(movie1['genres'])}"
        content2 = f"{movie2['title']} {movie2['description']} {' '.join(movie2['genres'])}"
        hash1 = hashlib.sha256(content1.encode()).hexdigest()
        hash2 = hashlib.sha256(content2.encode()).hexdigest()
        assert hash1 != hash2

    @pytest.mark.asyncio
    async def test_embed_movies_calls_qdrant(self, embedder, sample_movies):
        """Test that embed_movies upserts to Qdrant."""
        embedder._qdrant.upsert = AsyncMock()
        embedder._model.encode = MagicMock(return_value=[[0.1] * 768] * len(sample_movies))

        await embedder.embed_movies(sample_movies)

        embedder._qdrant.upsert.assert_called_once()

    @pytest.mark.asyncio
    async def test_search_returns_results(self, embedder, sample_movies):
        """Test that search returns relevant movies."""
        mock_result = MagicMock()
        mock_result.id = "movie-1"
        mock_result.score = 0.95
        mock_result.payload = {"title": "Avengers: Endgame"}

        embedder._qdrant.search = AsyncMock(return_value=[mock_result])
        embedder._model.encode = MagicMock(return_value=[0.1] * 768)

        results = await embedder.search("action movie", limit=5)

        assert len(results) > 0
        embedder._qdrant.search.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_movie(self, embedder):
        """Test that delete_movie removes from Qdrant."""
        embedder._qdrant.delete = AsyncMock()

        await embedder.delete_movie("movie-1")

        embedder._qdrant.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_search_by_id(self, embedder):
        """Test that search_by_id finds similar movies."""
        mock_point = MagicMock()
        mock_point.vector = [0.1] * 768
        embedder._qdrant.retrieve = AsyncMock(return_value=[mock_point])

        mock_result = MagicMock()
        mock_result.id = "movie-2"
        mock_result.score = 0.85
        embedder._qdrant.search = AsyncMock(return_value=[mock_result])

        results = await embedder.search_by_id("movie-1", limit=3)

        assert len(results) > 0
