import re
import json
from datetime import datetime, timezone, timedelta, date
from fastapi import APIRouter
from loguru import logger
from models import ClassifyIntentRequest, ClassifyIntentResponse
from core.prompts import CLASSIFY_SYSTEM_PROMPT
from core.llm_client import call_deepseek

router = APIRouter()

@router.post("/classify-intent", response_model=ClassifyIntentResponse)
async def classify_intent(request: ClassifyIntentRequest):
    """Classify user message into predefined Cinema intents and extract variables."""
    tz_vietnam = timezone(timedelta(hours=7))
    today = datetime.now(tz_vietnam).date()
    
    # Compute this-week range (Monday–Sunday)
    week_start = today - timedelta(days=today.weekday())  # Monday
    week_end = week_start + timedelta(days=6)             # Sunday
    next_week_start = week_start + timedelta(days=7)
    next_week_end = next_week_start + timedelta(days=6)
    weekend_start = week_start + timedelta(days=5)        # Saturday
    weekend_end = week_end                                 # Sunday

    system_prompt = CLASSIFY_SYSTEM_PROMPT.format(
        today_str=today_str,
        tomorrow_str=(today + timedelta(days=1)).strftime('%Y-%m-%d'),
        week_start_str=week_start.strftime('%Y-%m-%d'),
        week_end_str=week_end.strftime('%Y-%m-%d'),
        next_week_start_str=next_week_start.strftime('%Y-%m-%d'),
        next_week_end_str=next_week_end.strftime('%Y-%m-%d'),
        weekend_start_str=weekend_start.strftime('%Y-%m-%d'),
        weekend_end_str=weekend_end.strftime('%Y-%m-%d')
    )

    response_text = await call_deepseek(system_prompt, request.message, temperature=0.2)

    try:
        match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if match:
            json_data = json.loads(match.group(0))
        else:
            json_data = json.loads(response_text)

        intent = json_data.get("Intent", "GeneralFAQ")
        parameters = json_data.get("Parameters", {})

        parameters_str = {}
        if isinstance(parameters, dict):
            for k, v in parameters.items():
                parameters_str[k] = str(v) if v is not None else ""

        valid_intents = {
            "GetMovies", "GetShowtimes", "GetMyBookings",
            "GetCinemaStatistics", "GetShowtimeRecommendations",
            "GetSystemAuditLogs", "GeneralFAQ",
            "GetPromotions", "GetBookingStatus", "GetCinemaLocations",
            "GetAvailableSeats", "SearchMoviesSemantic",
            "GetTrendingMovies"
        }
        if intent not in valid_intents:
            intent = "GeneralFAQ"

        return ClassifyIntentResponse(intent=intent, parameters=parameters_str)
    except Exception as e:
        logger.error(f"Error parsing intent classifier response: {e}. Raw text: {response_text}")
        return ClassifyIntentResponse(intent="GeneralFAQ", parameters={})
