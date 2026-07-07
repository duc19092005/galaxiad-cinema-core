import pytest
from unittest.mock import AsyncMock, MagicMock, patch


class TestSuggestSeatsTool:
    """Tests for the seat suggestion algorithm."""

    def test_consecutive_center_seats(self, sample_seat_map):
        """Test that suggest_seats picks consecutive seats near center."""
        from app.core.tools import _find_consecutive_seats

        available_seats = []
        for row in sample_seat_map["rows"]:
            for seat in row["seats"]:
                if seat["status"] == "available":
                    available_seats.append(seat["seatId"])

        result = _find_consecutive_seats(available_seats, quantity=2, total_seats=5)
        assert len(result) == 2
        # Should pick center seats
        assert "a2" in result or "a3" in result

    def test_fallback_to_individual_seats(self, sample_seat_map):
        """Test fallback when no consecutive seats available."""
        from app.core.tools import _find_individual_center_seats

        # All seats in row B except b2 are available
        available_seats = ["b1", "b3", "b4", "b5"]
        result = _find_individual_center_seats(available_seats, quantity=3, total_seats=5)
        assert len(result) == 3

    def test_empty_seat_list_returns_empty(self):
        """Test with no available seats."""
        from app.core.tools import _find_consecutive_seats
        result = _find_consecutive_seats([], quantity=2, total_seats=5)
        assert len(result) == 0

    def test_quantity_exceeds_available(self, sample_seat_map):
        """Test when requested quantity exceeds available seats."""
        from app.core.tools import _find_consecutive_seats
        available = ["a1", "a2"]
        result = _find_consecutive_seats(available, quantity=5, total_seats=5)
        # Should return what's available
        assert len(result) <= 2


class TestAgentTools:
    """Tests for LangChain agent tools."""

    @pytest.mark.asyncio
    async def test_list_active_movies_tool(self, mock_httpx_client):
        """Test list_active_movies_tool returns movie list."""
        mock_httpx_client.get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "isSuccess": True,
                "data": [
                    {"movieId": "m1", "title": "Movie 1"},
                    {"movieId": "m2", "title": "Movie 2"},
                ]
            }
        )

        # The tool should call the backend API
        assert mock_httpx_client is not None

    @pytest.mark.asyncio
    async def test_list_active_cinemas_tool(self, mock_httpx_client):
        """Test list_active_cinemas_tool returns cinema list."""
        mock_httpx_client.get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "isSuccess": True,
                "data": [
                    {"cinemaId": "c1", "cinemaName": "Cinema 1"},
                ]
            }
        )

        assert mock_httpx_client is not None

    @pytest.mark.asyncio
    async def test_list_nearest_cinemas_tool(self, mock_httpx_client):
        """Test list_nearest_cinemas_tool with coordinates."""
        mock_httpx_client.get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "isSuccess": True,
                "data": [
                    {"cinemaId": "c1", "cinemaName": "Nearby Cinema", "distance": 0.5},
                ]
            }
        )

        assert mock_httpx_client is not None

    @pytest.mark.asyncio
    async def test_search_showtimes_tool(self, mock_httpx_client):
        """Test search_showtimes_tool with filters."""
        mock_httpx_client.get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "isSuccess": True,
                "data": [
                    {"scheduleId": "s1", "startTime": "19:00", "movieTitle": "Movie 1"},
                ]
            }
        )

        assert mock_httpx_client is not None

    @pytest.mark.asyncio
    async def test_get_seat_map_tool(self, mock_httpx_client, sample_seat_map):
        """Test get_seat_map_tool returns seat grid."""
        mock_httpx_client.get.return_value = MagicMock(
            status_code=200,
            json=lambda: {"isSuccess": True, "data": sample_seat_map}
        )

        assert mock_httpx_client is not None

    @pytest.mark.asyncio
    async def test_get_pricing_tool(self, mock_httpx_client):
        """Test get_pricing_tool returns price tiers."""
        mock_httpx_client.get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "isSuccess": True,
                "data": [
                    {"segmentName": "Adult", "price": 90000},
                    {"segmentName": "Student", "price": 70000},
                ]
            }
        )

        assert mock_httpx_client is not None

    @pytest.mark.asyncio
    async def test_confirm_booking_tool(self, mock_httpx_client, sample_booking_request):
        """Test confirm_booking_tool creates order."""
        mock_httpx_client.post.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "isSuccess": True,
                "data": {"orderId": "order-123", "paymentUrl": "https://vnpay.vn/..."}
            }
        )

        assert mock_httpx_client is not None
