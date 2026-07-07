import pytest
from pydantic import ValidationError


class TestPydanticModels:
    """Tests for Pydantic request/response models."""

    def test_embed_movies_request_valid(self):
        from app.models import EmbedMoviesRequest
        request = EmbedMoviesRequest(movies=[
            {"movieId": "m1", "title": "Movie 1", "description": "Desc"}
        ])
        assert len(request.movies) == 1

    def test_embed_movies_request_empty_list(self):
        from app.models import EmbedMoviesRequest
        request = EmbedMoviesRequest(movies=[])
        assert len(request.movies) == 0

    def test_recommend_request_valid(self):
        from app.models import RecommendRequest
        request = RecommendRequest(query="action movies", limit=5)
        assert request.query == "action movies"
        assert request.limit == 5

    def test_recommend_request_default_limit(self):
        from app.models import RecommendRequest
        request = RecommendRequest(query="comedy")
        assert request.limit > 0

    def test_classify_intent_request_valid(self):
        from app.models import ClassifyIntentRequest
        request = ClassifyIntentRequest(message="What movies are showing today?")
        assert request.message == "What movies are showing today?"

    def test_chat_request_valid(self):
        from app.models import ChatLlmRequest
        request = ChatLlmRequest(
            message="I want to book a movie",
            session_id="session-123"
        )
        assert request.message == "I want to book a movie"
        assert request.session_id == "session-123"

    def test_health_response(self):
        from app.models import HealthResponse
        response = HealthResponse(status="ok", version="1.0.0")
        assert response.status == "ok"

    def test_moderation_request_valid(self):
        from app.models import ModerationRequest
        request = ModerationRequest(text="This is a nice comment")
        assert request.text == "This is a nice comment"

    def test_guard_request_valid(self):
        from app.models import GuardRequest
        request = GuardRequest(input_text="Hello, what movies are showing?")
        assert "movies" in request.input_text
