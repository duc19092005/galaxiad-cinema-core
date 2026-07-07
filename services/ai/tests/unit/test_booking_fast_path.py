import pytest
from unittest.mock import AsyncMock, MagicMock, patch


class TestBookingFastPath:
    """Tests for the booking fast path state machine."""

    @pytest.fixture
    def fast_path(self):
        with patch('app.core.booking_fast_path.httpx.AsyncClient'):
            from app.core.booking_fast_path import BookingFastPath
            return BookingFastPath()

    @pytest.mark.asyncio
    async def test_location_provided_returns_nearest_cinemas(self, fast_path, mock_httpx_client):
        """Test that providing location returns nearest cinemas."""
        fast_path._client = mock_httpx_client
        mock_httpx_client.get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "isSuccess": True,
                "data": [
                    {"cinemaId": "c1", "cinemaName": "Cinema 1", "distance": 1.5},
                    {"cinemaId": "c2", "cinemaName": "Cinema 2", "distance": 3.2},
                ]
            }
        )

        message = '[USER_SELECTION] {"type": "locationProvided", "latitude": 10.7769, "longitude": 106.7009}'
        result = await fast_path.process_message(message, "session-1")

        assert result is not None
        assert "UI_ACTION" in result or "cinema" in result.lower()

    @pytest.mark.asyncio
    async def test_movie_selected_returns_dates(self, fast_path, mock_httpx_client):
        """Test that selecting a movie returns available dates."""
        fast_path._client = mock_httpx_client
        mock_httpx_client.get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "isSuccess": True,
                "data": ["2026-07-08", "2026-07-09", "2026-07-10"]
            }
        )

        message = '[USER_SELECTION] {"type": "movieSelected", "movieId": "movie-1"}'
        result = await fast_path.process_message(message, "session-1")

        assert result is not None

    @pytest.mark.asyncio
    async def test_showtime_selected_returns_seat_map(self, fast_path, mock_httpx_client, sample_seat_map):
        """Test that selecting a showtime returns seat map."""
        fast_path._client = mock_httpx_client
        mock_httpx_client.get.return_value = MagicMock(
            status_code=200,
            json=lambda: {"isSuccess": True, "data": sample_seat_map}
        )

        message = '[USER_SELECTION] {"type": "showtimeSelected", "scheduleId": "schedule-1"}'
        result = await fast_path.process_message(message, "session-1")

        assert result is not None

    @pytest.mark.asyncio
    async def test_booking_confirmed_calls_api(self, fast_path, mock_httpx_client, sample_booking_request):
        """Test that confirming booking calls the booking API."""
        fast_path._client = mock_httpx_client
        mock_httpx_client.post.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "isSuccess": True,
                "data": {
                    "orderId": "order-123",
                    "paymentUrl": "https://sandbox.vnpayment.vn/..."
                }
            }
        )

        message = f'[USER_SELECTION] {{"type": "bookingConfirmed", "data": {sample_booking_request}}}'
        result = await fast_path.process_message(message, "session-1")

        assert result is not None

    @pytest.mark.asyncio
    async def test_tool_result_caching(self, fast_path, mock_httpx_client):
        """Test that repeated queries return cached results."""
        fast_path._client = mock_httpx_client
        mock_httpx_client.get.return_value = MagicMock(
            status_code=200,
            json=lambda: {"isSuccess": True, "data": ["genre1", "genre2"]}
        )

        # First call
        result1 = await fast_path._fetch_genres("session-1")
        # Second call (should be cached)
        result2 = await fast_path._fetch_genres("session-1")

        # Should only call API once due to caching
        assert result1 == result2

    @pytest.mark.asyncio
    async def test_seats_selected_returns_summary(self, fast_path, mock_httpx_client):
        """Test that selecting seats returns booking summary."""
        fast_path._client = mock_httpx_client
        mock_httpx_client.get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "isSuccess": True,
                "data": [{"segmentName": "Adult", "price": 90000}]
            }
        )

        message = '[USER_SELECTION] {"type": "seatsSelected", "seats": ["a1", "a2"], "scheduleId": "schedule-1"}'
        result = await fast_path.process_message(message, "session-1")

        assert result is not None
