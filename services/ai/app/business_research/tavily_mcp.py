from __future__ import annotations

import json
from datetime import datetime
from urllib.parse import urlparse

import httpx
from loguru import logger

from config import (
    BUSINESS_RESEARCH_MAX_RESULTS,
    BUSINESS_RESEARCH_TIMEOUT_SECONDS,
    TAVILY_API_KEY,
    TAVILY_MCP_URL,
)

from .models import Evidence

try:
    from mcp import ClientSession
    from mcp.client.streamable_http import streamablehttp_client
except ImportError:  # pragma: no cover - optional in lightweight local environments
    ClientSession = None
    streamablehttp_client = None


# Official remote MCP tool names use underscores (list_tools → tavily_search, ...).
TAVILY_MCP_SEARCH_TOOL = "tavily_search"

HIGH_TRUST_DOMAINS = {
    "chinhphu.vn",
    "hanoi.gov.vn",
    "hochiminhcity.gov.vn",
    "tphcm.chinhphu.vn",
    "vnexpress.net",
    "tuoitre.vn",
    "cafef.vn",
}


def _domain(url: str) -> str:
    return urlparse(url).netloc.lower().removeprefix("www.")


def _trust_tier(domain: str) -> str:
    if domain.endswith(".gov.vn") or any(domain == item or domain.endswith(f".{item}") for item in HIGH_TRUST_DOMAINS):
        return "high"
    if domain.endswith((".com.vn", ".vn", ".com")):
        return "medium"
    return "low"


def _parse_date(value: object) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def _extract_result_rows(payload: object) -> list[dict]:
    """Normalize Tavily MCP / HTTP payloads into a list of result dicts."""
    if payload is None:
        return []
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if not isinstance(payload, dict):
        return []

    for key in ("results", "data", "items"):
        rows = payload.get(key)
        if isinstance(rows, list):
            return [item for item in rows if isinstance(item, dict)]

    # Some MCP wrappers nest under "result"
    nested = payload.get("result")
    if isinstance(nested, dict):
        return _extract_result_rows(nested)
    if isinstance(nested, list):
        return [item for item in nested if isinstance(item, dict)]
    return []


class TavilyMcpSearchProvider:
    """Tavily search via remote MCP, with HTTP API fallback.

    Important: empty MCP results must fall back to HTTP. The previous bug called
    tool name ``tavily-search`` (hyphen) while Tavily exposes ``tavily_search``
    (underscore), so MCP returned a text error that was silently mapped to [].
    """

    async def search(self, query: str, iteration: int) -> list[Evidence]:
        if not TAVILY_API_KEY:
            raise RuntimeError("TAVILY_API_KEY is required for business research.")

        if ClientSession and streamablehttp_client:
            try:
                mcp_results = await self._search_mcp(query, iteration)
                if mcp_results:
                    return mcp_results
                logger.warning(
                    "Tavily MCP returned 0 results for query={!r}; falling back to HTTP Search API.",
                    query[:120],
                )
            except Exception as exc:
                logger.warning(f"Tavily MCP search failed, using Tavily HTTP fallback: {exc}")

        return await self._search_http(query, iteration)

    async def _search_mcp(self, query: str, iteration: int) -> list[Evidence]:
        endpoint = TAVILY_MCP_URL or f"https://mcp.tavily.com/mcp/?tavilyApiKey={TAVILY_API_KEY}"
        async with streamablehttp_client(endpoint) as (read_stream, write_stream, _):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                result = await session.call_tool(
                    TAVILY_MCP_SEARCH_TOOL,
                    arguments={
                        "query": query,
                        "max_results": BUSINESS_RESEARCH_MAX_RESULTS,
                        "search_depth": "advanced",
                    },
                )

        payloads: list[dict] = []
        for content in result.content:
            text = getattr(content, "text", "") or ""
            if not text:
                continue
            # Surface MCP tool errors instead of treating them as empty success.
            lowered = text.lower()
            if "unknown tool" in lowered or text.startswith("Not found:"):
                raise RuntimeError(f"Tavily MCP tool error: {text}")
            try:
                parsed = json.loads(text)
            except json.JSONDecodeError:
                logger.debug("Tavily MCP non-JSON content: {}", text[:200])
                continue
            payloads.extend(_extract_result_rows(parsed))

        is_error = getattr(result, "isError", False)
        if is_error and not payloads:
            raise RuntimeError(f"Tavily MCP call_tool isError with content={result.content!r}")

        return self._map_results(payloads, query, iteration, "tavily_mcp")

    async def _search_http(self, query: str, iteration: int) -> list[Evidence]:
        async with httpx.AsyncClient(timeout=BUSINESS_RESEARCH_TIMEOUT_SECONDS) as client:
            response = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": TAVILY_API_KEY,
                    "query": query,
                    "search_depth": "advanced",
                    "max_results": BUSINESS_RESEARCH_MAX_RESULTS,
                    "include_raw_content": True,
                },
            )
            response.raise_for_status()
            body = response.json()
        rows = _extract_result_rows(body)
        if not rows:
            logger.warning("Tavily HTTP Search returned 0 results for query={!r}", query[:120])
        return self._map_results(rows, query, iteration, "tavily_http")

    def _map_results(self, results: list[dict], query: str, iteration: int, source_type: str) -> list[Evidence]:
        mapped: list[Evidence] = []
        for item in results:
            url = str(item.get("url") or "")
            if not url:
                continue
            domain = _domain(url)
            mapped.append(
                Evidence(
                    url=url,
                    title=str(item.get("title") or domain),
                    snippet=str(item.get("content") or item.get("snippet") or "")[:1000],
                    extracted_content=str(item.get("raw_content") or item.get("content") or "")[:12000],
                    published_date=_parse_date(item.get("published_date")),
                    query_used=query,
                    source_domain=domain,
                    source_type=source_type,
                    domain_trust_tier=_trust_tier(domain),
                    iteration_added=iteration,
                )
            )
        return mapped
