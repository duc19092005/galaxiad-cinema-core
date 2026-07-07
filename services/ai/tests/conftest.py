import sys
import os

# Add the services/ai root (/app) to sys.path so 'app' package is importable as 'app.*'
_ai_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # /app/
if _ai_root not in sys.path:
    sys.path.insert(0, _ai_root)

# Also add /app/app to sys.path so internal imports like 'from config import ...' work
_app_dir = os.path.join(_ai_root, 'app')
if _app_dir not in sys.path:
    sys.path.insert(0, _app_dir)

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch


@pytest.fixture
def mock_redis():
    """Mock Redis client for tests."""
    mock = MagicMock()
    mock.get = AsyncMock(return_value=None)
    mock.set = AsyncMock(return_value=True)
    mock.delete = AsyncMock(return_value=True)
    mock.exists = AsyncMock(return_value=False)
    mock.expire = AsyncMock(return_value=True)
    return mock


@pytest.fixture
def mock_qdrant():
    """Mock Qdrant client for tests."""
    mock = MagicMock()
    mock.upsert = AsyncMock(return_value=True)
    mock.search = AsyncMock(return_value=[])
    mock.delete = AsyncMock(return_value=True)
    mock.get_collection = AsyncMock(return_value=MagicMock(
        vectors_count=100,
        points_count=100
    ))
    mock.create_collection = AsyncMock(return_value=True)
    return mock


@pytest.fixture
def mock_httpx_client():
    """Mock httpx AsyncClient for backend API calls."""
    mock = AsyncMock()
    mock.get = AsyncMock()
    mock.post = AsyncMock()
    mock.aclose = AsyncMock()
    return mock


@pytest.fixture
def sample_movies():
    """Sample movie data for tests."""
    return [
        {
            "movieId": "movie-1",
            "title": "Avengers: Endgame",
            "description": "The Avengers assemble to reverse Thanos' snap",
            "genres": ["Action", "Sci-Fi"],
            "duration": 181,
            "posterUrl": "https://example.com/poster1.jpg"
        },
        {
            "movieId": "movie-2",
            "title": "Parasite",
            "description": "A poor family schemes to become employed by a wealthy family",
            "genres": ["Thriller", "Drama"],
            "duration": 132,
            "posterUrl": "https://example.com/poster2.jpg"
        },
        {
            "movieId": "movie-3",
            "title": "Spider-Man: No Way Home",
            "description": "Spider-Man faces multiverse villains",
            "genres": ["Action", "Adventure"],
            "duration": 148,
            "posterUrl": "https://example.com/poster3.jpg"
        },
    ]


@pytest.fixture
def sample_seat_map():
    """Sample seat map data for tests."""
    return {
        "rows": [
            {
                "rowLabel": "A",
                "seats": [
                    {"seatId": "a1", "status": "available"},
                    {"seatId": "a2", "status": "available"},
                    {"seatId": "a3", "status": "available"},
                    {"seatId": "a4", "status": "available"},
                    {"seatId": "a5", "status": "available"},
                ]
            },
            {
                "rowLabel": "B",
                "seats": [
                    {"seatId": "b1", "status": "available"},
                    {"seatId": "b2", "status": "locked"},
                    {"seatId": "b3", "status": "available"},
                    {"seatId": "b4", "status": "available"},
                    {"seatId": "b5", "status": "available"},
                ]
            },
            {
                "rowLabel": "C",
                "seats": [
                    {"seatId": "c1", "status": "available"},
                    {"seatId": "c2", "status": "available"},
                    {"seatId": "c3", "status": "available"},
                    {"seatId": "c4", "status": "locked"},
                    {"seatId": "c5", "status": "available"},
                ]
            },
        ]
    }


@pytest.fixture
def sample_booking_request():
    """Sample booking request data."""
    return {
        "scheduleId": "schedule-123",
        "seatSelections": [
            {"seatId": "a2", "userSegmentId": "adult"},
            {"seatId": "a3", "userSegmentId": "adult"},
        ],
        "customerName": "Nguyen Van A",
        "customerEmail": "nguyenvana@test.com",
        "customerPhone": "0901234567"
    }
