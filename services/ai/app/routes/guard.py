import re
import json
from fastapi import APIRouter
from loguru import logger
from models import GuardRequest, GuardResponse
from core.prompts import GUARD_SYSTEM_PROMPT
from core.llm_client import call_deepseek

router = APIRouter()

@router.post("/guard", response_model=GuardResponse)
async def guard_message(request: GuardRequest):
    """
    Security gate: phát hiện prompt injection, jailbreak, câu hỏi nhạy cảm,
    lạm dụng LLM, và system probe trước khi classify intent.
    """
    language_mapping = {
        "vi": "Vietnamese",
        "ru": "Russian",
        "en": "English"
    }
    lang_name = language_mapping.get((request.language or "vi").lower(), "Vietnamese")

    system_prompt = GUARD_SYSTEM_PROMPT.format(lang_name=lang_name)
    response_text = await call_deepseek(system_prompt, request.message, temperature=0.0)

    try:
        match = re.search(r"\{.*\}", response_text, re.DOTALL)
        data = json.loads(match.group(0) if match else response_text)
        return GuardResponse(
            is_blocked=bool(data.get("is_blocked", False)),
            reason=str(data.get("reason", ""))
        )
    except Exception as e:
        logger.error(f"Guard parsing error: {e}. Raw: {response_text}")
        return GuardResponse(is_blocked=False, reason="")
