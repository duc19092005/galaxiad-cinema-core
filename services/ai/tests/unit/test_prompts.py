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
