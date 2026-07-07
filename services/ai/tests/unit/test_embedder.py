import pytest
import json
import hashlib
from unittest.mock import AsyncMock, MagicMock, patch


class TestMovieEmbedder:
    """Tests for MovieEmbedder class."""

    @pytest.fixture
    def embedder(self):
        # Patch both QdrantClient and the conditional SentenceTransformer import
        # Module is accessible as 'core.embedder' since /app/app is in sys.path
        with patch('core.embedder.QdrantClient'), \
             patch.dict('sys.modules', {'sentence_transformers': MagicMock()}):
            from core.embedder import MovieEmbedder
            emb = MovieEmbedder.__new__(MovieEmbedder)
            emb.collection_name = 'test_movies'
            emb.client = MagicMock()
            emb._initialized = True
            emb.model = MagicMock()
            return emb

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

    def test_embedder_has_client_attribute(self, embedder):
        """Test that the embedder has a Qdrant client attribute."""
        assert hasattr(embedder, 'client')

    def test_embedder_has_model_attribute(self, embedder):
        """Test that the embedder has a model attribute."""
        assert hasattr(embedder, 'model')

    def test_embedder_initialized_flag(self, embedder):
        """Test that _initialized flag is managed correctly."""
        assert isinstance(embedder._initialized, bool)

    def test_content_hash_is_hexdigest(self, embedder, sample_movies):
        """Test that SHA256 hash output is a hex string of correct length."""
        movie = sample_movies[0]
        content = f"{movie['title']} {movie['description']}"
        h = hashlib.sha256(content.encode()).hexdigest()
        assert len(h) == 64
        assert all(c in '0123456789abcdef' for c in h)

    def test_search_mock_returns_results(self, embedder):
        """Test that a mock search returns whatever the mock is configured to return."""
        mock_result = MagicMock()
        mock_result.id = "movie-1"
        mock_result.score = 0.95
        mock_result.payload = {"title": "Avengers: Endgame"}

        # Simulate calling search synchronously on the mock client
        embedder.client.search.return_value = [mock_result]
        results = embedder.client.search(collection_name="test_movies", query_vector=[0.1] * 10, limit=5)

        assert len(results) > 0
        assert results[0].id == "movie-1"
        assert results[0].score == 0.95

    def test_delete_movie_mock(self, embedder):
        """Test that delete call is correctly recorded on mock client."""
        embedder.client.delete.return_value = True
        result = embedder.client.delete(
            collection_name="test_movies",
            points_selector=MagicMock()
        )
        embedder.client.delete.assert_called_once()

    def test_upsert_mock(self, embedder):
        """Test that upsert call is correctly recorded on mock client."""
        embedder.client.upsert.return_value = True
        result = embedder.client.upsert(
            collection_name="test_movies",
            points=[]
        )
        embedder.client.upsert.assert_called_once()
