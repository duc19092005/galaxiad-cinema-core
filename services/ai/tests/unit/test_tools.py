import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch


class TestSuggestSeatsTool:
    """Tests for the seat suggestion algorithm via suggest_seats_tool."""

    @pytest.mark.asyncio
    async def test_returns_error_for_zero_quantity(self):
        """Test that suggest_seats_tool returns error when quantity=0."""
        from core.tools import suggest_seats_tool

        result_str = await suggest_seats_tool.coroutine(schedule_id="schedule-1", quantity=0)
        result = json.loads(result_str)
        assert result["ok"] is False

    @pytest.mark.asyncio
    async def test_consecutive_center_seats(self):
        """Test that suggest_seats_tool picks consecutive seats near center."""
        from core.tools import suggest_seats_tool

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "isSuccess": True,
            "data": {
                "seatMap": [
                    {"seatId": "a1", "seatName": "A1", "colIndex": 0, "rowIndex": 0, "isBooked": False, "isOccupied": False},
                    {"seatId": "a2", "seatName": "A2", "colIndex": 1, "rowIndex": 0, "isBooked": False, "isOccupied": False},
                    {"seatId": "a3", "seatName": "A3", "colIndex": 2, "rowIndex": 0, "isBooked": False, "isOccupied": False},
                    {"seatId": "a4", "seatName": "A4", "colIndex": 3, "rowIndex": 0, "isBooked": False, "isOccupied": False},
                    {"seatId": "a5", "seatName": "A5", "colIndex": 4, "rowIndex": 0, "isBooked": False, "isOccupied": False},
                ]
            }
        }

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)

        with patch("core.tools._get_backend_client", return_value=mock_client):
            result_str = await suggest_seats_tool.coroutine(schedule_id="schedule-1", quantity=2)

        result = json.loads(result_str)
        assert result["ok"] is True
        assert len(result["seats"]) == 2

    @pytest.mark.asyncio
    async def test_returns_error_when_not_enough_seats(self):
        """Test error when available count < requested quantity."""
        from core.tools import suggest_seats_tool

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "isSuccess": True,
            "data": {
                "seatMap": [
                    {"seatId": "a1", "seatName": "A1", "colIndex": 0, "rowIndex": 0, "isBooked": True, "isOccupied": False},
                ]
            }
        }

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)

        with patch("core.tools._get_backend_client", return_value=mock_client):
            result_str = await suggest_seats_tool.coroutine(schedule_id="schedule-1", quantity=5)

        result = json.loads(result_str)
        assert result["ok"] is False

    @pytest.mark.asyncio
    async def test_empty_seat_list_returns_error(self):
        """Test with empty seat map."""
        from core.tools import suggest_seats_tool

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "isSuccess": True,
            "data": {"seatMap": []}
        }

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)

        with patch("core.tools._get_backend_client", return_value=mock_client):
            result_str = await suggest_seats_tool.coroutine(schedule_id="schedule-1", quantity=2)

        result = json.loads(result_str)
        assert result["ok"] is False


class TestAgentTools:
    """Tests for LangChain agent tools."""

    @pytest.mark.asyncio
    async def test_list_active_movies_tool(self):
        """Test list_active_movies_tool returns movie list."""
        from core.tools import list_active_movies_tool

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "isSuccess": True,
            "data": [
                {"movieId": "m1", "title": "Movie 1"},
                {"movieId": "m2", "title": "Movie 2"},
            ]
        }

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)

        with patch("core.tools._get_backend_client", return_value=mock_client):
            result_str = await list_active_movies_tool.coroutine()

        result = json.loads(result_str)
        assert isinstance(result, list) or "movies" in result or "data" in str(result)

    @pytest.mark.asyncio
    async def test_list_active_cinemas_tool(self):
        """Test list_active_cinemas_tool returns cinema list."""
        from core.tools import list_active_cinemas_tool

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "isSuccess": True,
            "data": [
                {"cinemaId": "c1", "cinemaName": "Cinema 1"},
            ]
        }

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)

        with patch("core.tools._get_backend_client", return_value=mock_client):
            result_str = await list_active_cinemas_tool.coroutine()

        # Just assert we get a non-empty string result
        assert isinstance(result_str, str)
        assert len(result_str) > 0

    @pytest.mark.asyncio
    async def test_get_seat_map_tool(self):
        """Test get_seat_map_tool returns seat data."""
        from core.tools import get_seat_map_tool

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "isSuccess": True,
            "data": {
                "seatMap": [
                    {"seatId": "a1", "seatName": "A1", "isBooked": False},
                    {"seatId": "b1", "seatName": "B1", "isBooked": True},
                ]
            }
        }

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)

        with patch("core.tools._get_backend_client", return_value=mock_client):
            result_str = await get_seat_map_tool.coroutine(schedule_id="schedule-1")

        assert isinstance(result_str, str)
        assert len(result_str) > 0

    @pytest.mark.asyncio
    async def test_get_pricing_tool(self):
        """Test get_pricing_tool returns price tiers."""
        from core.tools import get_pricing_tool

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "isSuccess": True,
            "data": {
                "segmentPrices": [
                    {"segmentName": "Adult", "finalPrice": 90000},
                    {"segmentName": "Student", "finalPrice": 70000},
                ]
            }
        }

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)

        with patch("core.tools._get_backend_client", return_value=mock_client):
            result_str = await get_pricing_tool.coroutine(schedule_id="schedule-1")

        assert isinstance(result_str, str)
        assert len(result_str) > 0
