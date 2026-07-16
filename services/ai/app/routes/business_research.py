import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from loguru import logger

from business_research.models import BusinessResearchRequest
from business_research.orchestrator import BusinessResearchOrchestrator


router = APIRouter(prefix="/business-research")


@router.post("/run/stream")
async def run_business_research_stream(request: BusinessResearchRequest):
    orchestrator = BusinessResearchOrchestrator()

    async def generate():
        try:
            async for item in orchestrator.stream(request):
                yield json.dumps(item, ensure_ascii=False) + "\n"
        except Exception as exc:
            logger.exception(f"Business research job {request.job_id} failed")
            yield json.dumps(
                {
                    "kind": "error",
                    "eventType": "failed",
                    "payload": {
                        "jobId": request.job_id,
                        "status": "failed",
                        "message": str(exc),
                    },
                },
                ensure_ascii=False,
            ) + "\n"

    return StreamingResponse(generate(), media_type="application/x-ndjson")


@router.post("/run")
async def run_business_research(request: BusinessResearchRequest):
    orchestrator = BusinessResearchOrchestrator()
    final_result = None
    try:
        async for item in orchestrator.stream(request):
            if item.get("kind") == "result":
                final_result = item["result"]
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if final_result is None:
        raise HTTPException(status_code=500, detail="Research completed without a result")
    return final_result
