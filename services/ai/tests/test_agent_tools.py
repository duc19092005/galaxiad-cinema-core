import pytest
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

# Ensure app/ is on path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "app"))

from agent import get_message_history
from langchain_core.chat_history import InMemoryChatMessageHistory
from tools import suggest_seats_tool

@pytest.mark.asyncio
async def test_get_message_history_fallback():
    """Verify that get_message_history falls back to InMemoryChatMessageHistory if Redis fails."""
    history = get_message_history("test_fallback_session_id")
    assert isinstance(history, InMemoryChatMessageHistory)

@pytest.mark.asyncio
async def test_suggest_seats_consecutive():
    """Verify suggest_seats_tool suggests consecutive seats near center."""
    mock_data = {
        "data": {
            "centerRowStart": 2,
            "centerRowEnd": 5,
            "centerColStart": 2,
            "centerColEnd": 7,
            "seats": [
                # Row 2 (Index 2)
                {"seatId": "s1", "seatNumber": "C1", "rowIndex": 2, "colIndex": 0, "isOccupied": False},
                {"seatId": "s2", "seatNumber": "C2", "rowIndex": 2, "colIndex": 1, "isOccupied": False},
                # Center seats (Row 2, Cols 3 and 4)
                {"seatId": "s3", "seatNumber": "C3", "rowIndex": 2, "colIndex": 3, "isOccupied": False},
                {"seatId": "s4", "seatNumber": "C4", "rowIndex": 2, "colIndex": 4, "isOccupied": False},
                # Occupied
                {"seatId": "s5", "seatNumber": "C5", "rowIndex": 2, "colIndex": 5, "isOccupied": True},
            ]
        }
    }
    
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_data
        mock_get.return_value = mock_response
        
        # We request 2 seats
        result = await suggest_seats_tool.ainvoke({"schedule_id": "dummy_schedule_id", "quantity": 2})
        
        # C3 and C4 are consecutive and closest to center, they should be suggested
        assert "C3, C4" in result

@pytest.mark.asyncio
async def test_suggest_seats_fallback_to_individual():
    """Verify suggest_seats_tool falls back to individual seats if no consecutive ones exist."""
    mock_data = {
        "data": {
            "centerRowStart": 2,
            "centerRowEnd": 5,
            "centerColStart": 2,
            "centerColEnd": 7,
            "seats": [
                {"seatId": "s1", "seatNumber": "C1", "rowIndex": 2, "colIndex": 1, "isOccupied": False},
                {"seatId": "s2", "seatNumber": "C3", "rowIndex": 2, "colIndex": 3, "isOccupied": False},
            ]
        }
    }
    
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_data
        mock_get.return_value = mock_response
        
        result = await suggest_seats_tool.ainvoke({"schedule_id": "dummy_schedule_id", "quantity": 2})
        assert "Gợi ý chọn các ghế lẻ gần trung tâm nhất" in result
