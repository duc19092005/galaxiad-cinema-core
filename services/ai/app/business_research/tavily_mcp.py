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


class TavilyMcpSearchProvider:
    """Tavily MCP client owned by the Python service, with a live HTTP fallback."""

    async def search(self, query: str, iteration: int) -> list[Evidence]:
        if not TAVILY_API_KEY:
            raise RuntimeError("TAVILY_API_KEY is required for business research.")

        if TAVILY_API_KEY and ClientSession and streamablehttp_client:
            try:
                return await self._search_mcp(query, iteration)
            except Exception as exc:
                logger.warning(f"Tavily MCP search failed, using Tavily HTTP fallback: {exc}")

        return await self._search_http(query, iteration)

    async def _search_mcp(self, query: str, iteration: int) -> list[Evidence]:
        endpoint = TAVILY_MCP_URL or f"https://mcp.tavily.com/mcp/?tavilyApiKey={TAVILY_API_KEY}"
        async with streamablehttp_client(endpoint) as (read_stream, write_stream, _):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                result = await session.call_tool(
                    "tavily-search",
                    arguments={"query": query, "max_results": BUSINESS_RESEARCH_MAX_RESULTS},
                )
        payloads: list[dict] = []
        for content in result.content:
            text = getattr(content, "text", "")
            if not text:
                continue
            try:
                parsed = json.loads(text)
                payloads.extend(parsed.get("results", parsed if isinstance(parsed, list) else []))
            except json.JSONDecodeError:
                continue
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
        return self._map_results(response.json().get("results", []), query, iteration, "tavily_http_fallback")

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
