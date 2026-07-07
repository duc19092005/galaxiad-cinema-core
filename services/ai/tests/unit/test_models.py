import pytest
from pydantic import ValidationError


class TestPydanticModels:
    """Tests for Pydantic request/response models."""

    def test_embed_movies_request_valid(self):
        from app.models import EmbedMoviesRequest, MovieItem
        request = EmbedMoviesRequest(movies=[
            MovieItem(movie_id="m1", embedding_text="Action movie about heroes")
        ])
        assert len(request.movies) == 1

    def test_embed_movies_request_empty_list(self):
        from app.models import EmbedMoviesRequest
        request = EmbedMoviesRequest(movies=[])
        assert len(request.movies) == 0

    def test_recommend_request_valid(self):
        from app.models import RecommendRequest
        # RecommendRequest uses user_text (not query) and top_k (not limit)
        request = RecommendRequest(user_text="action movies", top_k=5)
        assert request.user_text == "action movies"
        assert request.top_k == 5

    def test_recommend_request_default_limit(self):
        from app.models import RecommendRequest
        request = RecommendRequest(user_text="comedy")
        # Default top_k should be positive
        assert request.top_k > 0

    def test_classify_intent_request_valid(self):
        from app.models import ClassifyIntentRequest
        request = ClassifyIntentRequest(message="What movies are showing today?")
        assert request.message == "What movies are showing today?"

    def test_chat_request_valid(self):
        from app.models import ChatLlmRequest
        # ChatLlmRequest uses user_prompt (not message), and optional session_id
        request = ChatLlmRequest(
            user_prompt="I want to book a movie",
            session_id="session-123"
        )
        assert request.user_prompt == "I want to book a movie"
        assert request.session_id == "session-123"

    def test_health_response(self):
        from app.models import HealthResponse
        # HealthResponse has status, embedded_movies_count, model, vector_store
        response = HealthResponse(
            status="ok",
            embedded_movies_count=42,
            model="sentence-transformers/all-MiniLM-L6-v2"
        )
        assert response.status == "ok"
        assert response.embedded_movies_count == 42

    def test_moderation_request_valid(self):
        from app.models import ModerationRequest
        # ModerationRequest uses `content` (not `text`)
        request = ModerationRequest(content="This is a nice comment")
        assert request.content == "This is a nice comment"

    def test_guard_request_valid(self):
        from app.models import GuardRequest
        # GuardRequest uses `message` (not `input_text`)
        request = GuardRequest(message="Hello, what movies are showing?")
        assert "movies" in request.message
