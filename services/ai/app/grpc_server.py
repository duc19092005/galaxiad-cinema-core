"""
gRPC server for Cinema AI Service.
Runs side-by-side with FastAPI (dual-mode: gRPC primary, HTTP fallback).
Port: 50051
"""

import asyncio
import json
import re
import sys
from datetime import date, timedelta
from pathlib import Path

import grpc
from grpc import aio
from loguru import logger

# Ensure app/ is on path so we can import everything
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import EMBEDDING_MODEL

# Import generated stubs
from pb import ai_service_pb2 as pb
from pb import ai_service_pb2_grpc as pb_grpc

# Import core modules
from core.embedder import embedder
from core.agent import agent_with_history
from core.booking_fast_path import try_booking_fast_path
from core.llm_client import (
    call_deepseek,
    call_deepseek_stream,
    init_deepseek_client,
    close_deepseek_client
)
from core.prompts import (
    GUARD_SYSTEM_PROMPT,
    CLASSIFY_SYSTEM_PROMPT,
    MODERATE_SYSTEM_PROMPT,
    FALLBACK_CHAT_PROMPT
)


def _language_name(lang: str) -> str:
    mapping = {"vi": "Vietnamese", "ru": "Russian", "en": "English"}
    return mapping.get(lang.lower(), "Vietnamese")


def _build_chat_system_prompt(request: pb.ChatRequest) -> str:
    tool_context = (request.tool_context or "").strip()
    user_role = request.user_role or "Guest (Chưa đăng nhập)"
    user_id = request.user_id or "N/A"
    context_section = tool_context if tool_context else "No supporting context data retrieved."
    lang_name = _language_name(request.language or "vi")

    return FALLBACK_CHAT_PROMPT.format(
        user_role=user_role,
        user_id=user_id,
        context_section=context_section,
        lang_name=lang_name
    )


class AiServiceServicer(pb_grpc.AiServiceServicer):

    # --- Movie Embedding -------------------------------------------------------

    async def EmbedMovies(self, request: pb.EmbedMoviesRequest, context) -> pb.EmbedMoviesResponse:
        if not request.movies:
            await context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Movies list is empty")

        movies_tuples = [(m.movie_id, m.embedding_text) for m in request.movies]
        embedded_count = embedder.embed_movies(movies_tuples)

        logger.info(f"gRPC EmbedMovies: embedded {embedded_count}/{len(request.movies)} movies")
        return pb.EmbedMoviesResponse(
            success=embedded_count > 0,
            embedded_count=embedded_count,
            skipped_count=max(0, len(request.movies) - embedded_count),
            message=f"Embedded {embedded_count}/{len(request.movies)} movies. Total: {embedder.movie_count}",
        )

    async def SyncMovies(self, request: pb.EmbedMoviesRequest, context) -> pb.EmbedMoviesResponse:
        movies_tuples = [(m.movie_id, m.embedding_text) for m in request.movies]
        embedded_count, deleted_count, skipped_count = embedder.sync_movies(movies_tuples)
        return pb.EmbedMoviesResponse(
            success=True,
            embedded_count=embedded_count,
            deleted_count=deleted_count,
            skipped_count=skipped_count,
            message=f"Synced. embedded={embedded_count}, deleted={deleted_count}, skipped={skipped_count}",
        )

    async def DeleteEmbedding(self, request: pb.DeleteEmbeddingRequest, context) -> pb.EmbedMoviesResponse:
        deleted = embedder.delete_movie(request.movie_id)
        return pb.EmbedMoviesResponse(
            success=True,
            deleted_count=1 if deleted else 0,
            message=f"Deleted embedding for movie {request.movie_id}" if deleted else f"Movie {request.movie_id} not found",
        )

    # --- Semantic Search -------------------------------------------------------

    async def Recommend(self, request: pb.RecommendRequest, context) -> pb.RecommendResponse:
        if embedder.movie_count == 0:
            logger.warning("No movies embedded yet. Returning empty results.")
            return pb.RecommendResponse()

        if not request.user_text or len(request.user_text.strip()) < 5:
            await context.abort(grpc.StatusCode.INVALID_ARGUMENT, "user_text is too short")

        results = embedder.search(
            request.user_text,
            top_k=request.top_k,
            exclude_ids=list(request.exclude_ids) if request.exclude_ids else None,
        )
        movie_scores = [pb.MovieScore(movie_id=mid, distance=dist) for mid, dist in results]
        return pb.RecommendResponse(results=movie_scores)

    async def RecommendById(self, request: pb.RecommendByIdRequest, context) -> pb.RecommendResponse:
        if embedder.movie_count == 0:
            logger.warning("No movies embedded yet. Returning empty results.")
            return pb.RecommendResponse()

        movie_id_lower = request.movie_id.lower()
        exclude = [movie_id_lower]
        if request.exclude_ids:
            exclude.extend([e.lower() for e in request.exclude_ids])
        exclude = list(set(exclude))

        try:
            results = embedder.search_by_id(movie_id_lower, top_k=request.top_k, exclude_ids=exclude)
            movie_scores = [pb.MovieScore(movie_id=mid, distance=dist) for mid, dist in results]
            return pb.RecommendResponse(results=movie_scores)
        except Exception as e:
            logger.error(f"RecommendById failed: {e}")
            await context.abort(grpc.StatusCode.INTERNAL, f"Recommend by ID failed: {str(e)}")

    # --- Chatbot ----------------------------------------------------------------

    async def ClassifyIntent(self, request: pb.ClassifyIntentRequest, context) -> pb.ClassifyIntentResponse:
        """Classify user message into predefined Cinema intents."""
        today = date.today()
        today_str = today.strftime("%Y-%m-%d")
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        next_week_start = week_start + timedelta(days=7)
        next_week_end = next_week_start + timedelta(days=6)
        weekend_start = week_start + timedelta(days=5)
        weekend_end = week_end

        system_prompt = CLASSIFY_SYSTEM_PROMPT.format(
            today_str=today_str,
            tomorrow_str=(today + timedelta(days=1)).strftime("%Y-%m-%d"),
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
            json_data = json.loads(match.group(0) if match else response_text)
            intent = json_data.get("Intent", "GeneralFAQ")
            parameters = json_data.get("Parameters", {})

            params_str = {}
            if isinstance(parameters, dict):
                for k, v in parameters.items():
                    params_str[k] = str(v) if v is not None else ""

            return pb.ClassifyIntentResponse(intent=intent, parameters=params_str)
        except Exception:
            return pb.ClassifyIntentResponse(intent="GeneralFAQ", parameters={})

    async def Guard(self, request: pb.GuardRequest, context) -> pb.GuardResponse:
        """Security gate for prompt injection and abuse detection."""
        lang_name = _language_name(request.language or "vi")
        system_prompt = GUARD_SYSTEM_PROMPT.format(lang_name=lang_name)

        response_text = await call_deepseek(system_prompt, request.message, temperature=0.0)

        try:
            match = re.search(r"\{.*\}", response_text, re.DOTALL)
            data = json.loads(match.group(0) if match else response_text)
            return pb.GuardResponse(
                is_blocked=bool(data.get("is_blocked", False)),
                reason=str(data.get("reason", "")),
            )
        except Exception:
            return pb.GuardResponse(is_blocked=False, reason="")

    async def Chat(self, request: pb.ChatRequest, context) -> pb.ChatResponse:
        """Generate chatbot response using LangChain Agent."""
        try:
            fast_path_response = await try_booking_fast_path(
                request.user_prompt,
                request.tool_context or "",
                request.user_id or "N/A",
            )
            if fast_path_response:
                return pb.ChatResponse(response=fast_path_response)

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
            return pb.ChatResponse(response=response_text)
        except Exception as e:
            logger.error(f"LangChain gRPC Chat agent failed: {e}")
            try:
                system_prompt = _build_chat_system_prompt(request)
                response_text = await call_deepseek(system_prompt, request.user_prompt, temperature=0.2)
                return pb.ChatResponse(response=response_text)
            except Exception as inner_e:
                await context.abort(grpc.StatusCode.INTERNAL, f"Chat agent failed: {str(e)}. Fallback failed: {str(inner_e)}")

    async def ChatStream(self, request: pb.ChatRequest, context) -> pb.ChatResponse:
        """Stream chatbot response tokens via gRPC server-streaming using LangChain Agent."""
        try:
            fast_path_response = await try_booking_fast_path(
                request.user_prompt,
                request.tool_context or "",
                request.user_id or "N/A",
            )
            if fast_path_response:
                yield pb.ChatResponse(response=fast_path_response)
                return

            session_id = request.session_id or request.user_id or "default_session"
            config = {"configurable": {"session_id": session_id}}
            
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
                    content = event["data"].get("chunk").content
                    if content:
                        yield pb.ChatResponse(response=content)
        except Exception as e:
            logger.error(f"ChatStream agent failed: {e}")
            try:
                system_prompt = _build_chat_system_prompt(request)
                async for token in call_deepseek_stream(system_prompt, request.user_prompt, temperature=0.2):
                    yield pb.ChatResponse(response=token)
            except Exception as inner_e:
                logger.error(f"Fallback stream failed: {inner_e}")

    async def Moderate(self, request: pb.ModerationRequest, context) -> pb.ModerationResponse:
        """Moderate user comment content."""
        response_text = await call_deepseek(MODERATE_SYSTEM_PROMPT, request.content, temperature=0.0)

        try:
            match = re.search(r"\{.*\}", response_text, re.DOTALL)
            data = json.loads(match.group(0) if match else response_text)
            return pb.ModerationResponse(
                blocked=bool(data.get("blocked", False)),
                reason=str(data.get("reason", "Bình luận vi phạm tiêu chuẩn cộng đồng.")),
            )
        except Exception:
            return pb.ModerationResponse(blocked=False, reason="Moderation parsing failed.")

    # --- Health ----------------------------------------------------------------

    async def HealthCheck(self, request: pb.Empty, context) -> pb.HealthResponse:
        return pb.HealthResponse(
            status="ok",
            embedded_movies_count=embedder.movie_count,
            model=EMBEDDING_MODEL,
        )


# ============================================================
# Server Entry Point
# ============================================================

async def serve():
    server = aio.server()
    server.add_insecure_port("[::]:50051")
    pb_grpc.add_AiServiceServicer_to_server(AiServiceServicer(), server)

    logger.info("=" * 50)
    logger.info("gRPC server starting on port 50051...")
    logger.info(f"Embedding model: {EMBEDDING_MODEL}")
    
    # Initialize connection pools
    init_deepseek_client()
    
    embedder.ensure_collection(retries=10, delay_seconds=2)
    logger.info("gRPC server ready.")
    logger.info("=" * 50)

    await server.start()
    await server.wait_for_termination()


async def cleanup():
    await close_deepseek_client()
    logger.info("gRPC HTTP client cleaned up.")


if __name__ == "__main__":
    try:
        asyncio.run(serve())
    finally:
        asyncio.run(cleanup())
