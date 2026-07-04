import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from loguru import logger
from models import ChatLlmRequest, ChatLlmResponse
from core.agent import agent_with_history
from core.prompts import FALLBACK_CHAT_PROMPT
from core.llm_client import call_deepseek, call_deepseek_stream

router = APIRouter()

def get_fallback_system_prompt(request: ChatLlmRequest) -> str:
    language_mapping = {
        "vi": "Vietnamese",
        "ru": "Russian",
        "en": "English"
    }
    lang_name = language_mapping.get((request.language or "vi").lower(), "Vietnamese")
    
    return FALLBACK_CHAT_PROMPT.format(
        user_role=request.user_role or "Guest (Chua dang nhap)",
        user_id=request.user_id or "N/A",
        context_section=(request.tool_context or "").strip() or "No supporting context data retrieved.",
        lang_name=lang_name
    )

@router.post("/chat", response_model=ChatLlmResponse)
async def chat_llm(request: ChatLlmRequest):
    """
    Chatbot response generation endpoint using LangChain Agent.
    """
    try:
        session_id = request.session_id or request.user_id or "default_session"
        config = {"configurable": {"session_id": session_id}}
        
        result = await agent_with_history.ainvoke(
            {
                "input": request.user_prompt,
                "user_id": request.user_id or "N/A",
                "user_role": request.user_role or "Guest",
                "tool_context": request.tool_context or ""
            },
            config=config
        )
        response_text = result.get("output", "")
        return ChatLlmResponse(response=response_text)
    except Exception as e:
        logger.error(f"LangChain Chat agent failed in REST: {e}")
        # Fallback to direct DeepSeek call
        system_prompt = get_fallback_system_prompt(request)
        response_text = await call_deepseek(system_prompt, request.user_prompt, temperature=0.2)
        return ChatLlmResponse(response=response_text)

@router.post("/chat/stream")
async def chat_llm_stream(request: ChatLlmRequest):
    """Stream chatbot response tokens as Server-Sent Events using LangChain Agent."""
    session_id = request.session_id or request.user_id or "default_session"
    config = {"configurable": {"session_id": session_id}}

    async def event_generator():
        try:
            async for event in agent_with_history.astream_events(
                {
                    "input": request.user_prompt,
                    "user_id": request.user_id or "N/A",
                    "user_role": request.user_role or "Guest",
                    "tool_context": request.tool_context or ""
                },
                config=config,
                version="v2"
            ):
                kind = event.get("event")
                if kind == "on_chat_model_stream":
                    token = event["data"].get("chunk").content
                    if token:
                        yield f"event: token\ndata: {json.dumps({'text': token}, ensure_ascii=False)}\n\n"
            yield "event: done\ndata: {\"ok\": true}\n\n"
        except Exception as e:
            logger.error(f"Chat stream agent failed in REST: {e}")
            try:
                system_prompt = get_fallback_system_prompt(request)
                async for token in call_deepseek_stream(system_prompt, request.user_prompt, temperature=0.2):
                    yield f"event: token\ndata: {json.dumps({'text': token}, ensure_ascii=False)}\n\n"
                yield "event: done\ndata: {\"ok\": true}\n\n"
            except Exception as inner_e:
                logger.error(f"Fallback REST stream failed: {inner_e}")
                message = "Chatbot đang bận, bạn thử lại sau ít phút nhé."
                yield f"event: error\ndata: {json.dumps({'message': message}, ensure_ascii=False)}\n\n"
                yield "event: done\ndata: {\"ok\": false}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
