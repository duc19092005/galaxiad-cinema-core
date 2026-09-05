import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain_core.chat_history import InMemoryChatMessageHistory


_ai_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ai_root / "app"))
sys.path.insert(0, str(_ai_root))

from core.agent import get_message_history
from core.tools import suggest_seats_tool


@pytest.mark.asyncio
async def test_get_message_history_fallback():
    """Verify Redis failures fall back to in-memory chat history."""
    history = get_message_history("test_fallback_session_id")
    assert isinstance(history, InMemoryChatMessageHistory)


@pytest.mark.asyncio
async def test_suggest_seats_consecutive():
    """Verify suggest_seats_tool returns consecutive seats near center as JSON."""
    mock_data = {
        "data": {
            "centerRowStart": 2,
            "centerRowEnd": 5,
            "centerColStart": 2,
            "centerColEnd": 7,
            "seats": [
                {"seatId": "s1", "seatNumber": "C1", "rowIndex": 2, "colIndex": 0, "isOccupied": False},
                {"seatId": "s2", "seatNumber": "C2", "rowIndex": 2, "colIndex": 1, "isOccupied": False},
                {"seatId": "s3", "seatNumber": "C3", "rowIndex": 2, "colIndex": 3, "isOccupied": False},
                {"seatId": "s4", "seatNumber": "C4", "rowIndex": 2, "colIndex": 4, "isOccupied": False},
                {"seatId": "s5", "seatNumber": "C5", "rowIndex": 2, "colIndex": 5, "isOccupied": True},
            ],
        }
    }

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = mock_data

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)

    with patch("core.tools._get_backend_client", return_value=mock_client), \
         patch("httpx.AsyncClient.get", return_value=mock_response):
        result = await suggest_seats_tool.ainvoke({"schedule_id": "dummy_schedule_id", "quantity": 2})
        payload = json.loads(result)

        assert payload["ok"] is True
        assert payload["strategy"] == "center_consecutive"
        assert payload["seatNumbers"] == ["C3", "C4"]
        assert payload["seatIds"] == ["s3", "s4"]


@pytest.mark.asyncio
async def test_suggest_seats_fallback_to_individual():
    """Verify suggest_seats_tool falls back to individual seats if no cluster exists."""
    mock_data = {
        "data": {
            "centerRowStart": 2,
            "centerRowEnd": 5,
            "centerColStart": 2,
            "centerColEnd": 7,
            "seats": [
                {"seatId": "s1", "seatNumber": "C1", "rowIndex": 2, "colIndex": 1, "isOccupied": False},
                {"seatId": "s2", "seatNumber": "C3", "rowIndex": 2, "colIndex": 3, "isOccupied": False},
            ],
        }
    }

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = mock_data

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)

    with patch("core.tools._get_backend_client", return_value=mock_client), \
         patch("httpx.AsyncClient.get", return_value=mock_response):
        result = await suggest_seats_tool.ainvoke({"schedule_id": "dummy_schedule_id", "quantity": 2})
        payload = json.loads(result)

        assert payload["ok"] is True
        assert payload["strategy"] == "center_individual"
        assert payload["seatNumbers"] == ["C3", "C1"]
