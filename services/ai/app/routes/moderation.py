import re
import json
from fastapi import APIRouter
from loguru import logger
from models import ModerationRequest, ModerationResponse
from core.prompts import MODERATE_SYSTEM_PROMPT
from core.llm_client import call_deepseek

router = APIRouter()

@router.post("/moderate", response_model=ModerationResponse)
async def moderate_comment(request: ModerationRequest):
    """Moderate user comment content to filter out severe toxicity."""
    response_text = await call_deepseek(MODERATE_SYSTEM_PROMPT, request.content, temperature=0.0)

    try:
        match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if match:
            json_data = json.loads(match.group(0))
        else:
            json_data = json.loads(response_text)

        blocked = bool(json_data.get("blocked", False))
        reason = str(json_data.get("reason", "Bình luận vi phạm tiêu chuẩn cộng đồng."))
        return ModerationResponse(blocked=blocked, reason=reason)
    except Exception as e:
        logger.error(f"Error parsing moderation response: {e}. Raw text: {response_text}")
        return ModerationResponse(blocked=False, reason="Moderation parsing failed.")
