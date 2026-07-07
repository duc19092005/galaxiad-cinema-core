import pytest


class TestPrompts:
    """Tests for prompt templates."""

    def test_agent_system_prompt_exists(self):
        from app.core.prompts import AGENT_SYSTEM_PROMPT
        assert AGENT_SYSTEM_PROMPT is not None
        assert len(AGENT_SYSTEM_PROMPT) > 100

    def test_agent_system_prompt_contains_booking_flow(self):
        from app.core.prompts import AGENT_SYSTEM_PROMPT
        assert "booking" in AGENT_SYSTEM_PROMPT.lower() or "book" in AGENT_SYSTEM_PROMPT.lower()

    def test_agent_system_prompt_contains_ui_action(self):
        from app.core.prompts import AGENT_SYSTEM_PROMPT
        assert "UI_ACTION" in AGENT_SYSTEM_PROMPT

    def test_guard_system_prompt_exists(self):
        from app.core.prompts import GUARD_SYSTEM_PROMPT
        assert GUARD_SYSTEM_PROMPT is not None
        assert len(GUARD_SYSTEM_PROMPT) > 50

    def test_guard_prompt_mentions_safety(self):
        from app.core.prompts import GUARD_SYSTEM_PROMPT
        assert "safe" in GUARD_SYSTEM_PROMPT.lower() or "security" in GUARD_SYSTEM_PROMPT.lower() or "inject" in GUARD_SYSTEM_PROMPT.lower()

    def test_classify_system_prompt_exists(self):
        from app.core.prompts import CLASSIFY_SYSTEM_PROMPT
        assert CLASSIFY_SYSTEM_PROMPT is not None

    def test_classify_prompt_contains_intents(self):
        from app.core.prompts import CLASSIFY_SYSTEM_PROMPT
        assert "GetMovies" in CLASSIFY_SYSTEM_PROMPT
        assert "GetShowtimes" in CLASSIFY_SYSTEM_PROMPT

    def test_classify_prompt_contains_all_supported_chatbot_intents(self):
        from app.core.prompts import CLASSIFY_SYSTEM_PROMPT

        expected_intents = [
            "GetMovies",
            "GetShowtimes",
            "GetMyBookings",
            "GetCinemaStatistics",
            "GetShowtimeRecommendations",
            "GetSystemAuditLogs",
            "GeneralFAQ",
            "GetPromotions",
            "GetBookingStatus",
            "GetCinemaLocations",
            "GetAvailableSeats",
            "SearchMoviesSemantic",
            "GetTrendingMovies",
        ]

        for intent in expected_intents:
            assert intent in CLASSIFY_SYSTEM_PROMPT

    def test_guard_prompt_contains_required_block_categories(self):
        from app.core.prompts import GUARD_SYSTEM_PROMPT

        expected_categories = [
            "PROMPT_INJECTION",
            "SENSITIVE_DATA_FISHING",
            "LLM_MISUSE",
            "SYSTEM_PROBE",
            "OFF_TOPIC_HARM",
        ]

        for category in expected_categories:
            assert category in GUARD_SYSTEM_PROMPT

    def test_agent_prompt_contains_required_booking_ui_actions(self):
        from app.core.prompts import AGENT_SYSTEM_PROMPT

        expected_actions = [
            "bookingPathPicker",
            "moviePicker",
            "datePicker",
            "cinemaPicker",
            "showtimePicker",
            "segmentQuantityPicker",
            "seatSuggestion",
            "voucherPicker",
            "guestContact",
            "bookingSummary",
            "paymentAction",
        ]

        for action in expected_actions:
            assert action in AGENT_SYSTEM_PROMPT

    def test_moderate_system_prompt_exists(self):
        from app.core.prompts import MODERATE_SYSTEM_PROMPT
        assert MODERATE_SYSTEM_PROMPT is not None

    def test_fallback_chat_prompt_exists(self):
        from app.core.prompts import FALLBACK_CHAT_PROMPT
        assert FALLBACK_CHAT_PROMPT is not None

    def test_prompt_variables_preserved(self):
        """Test that LangChain template variables are preserved."""
        from app.core.prompts import AGENT_SYSTEM_PROMPT
        # LangChain uses {input}, {chat_history}, {agent_scratchpad}
        # The prompts should have these variables
        assert "{" in AGENT_SYSTEM_PROMPT
