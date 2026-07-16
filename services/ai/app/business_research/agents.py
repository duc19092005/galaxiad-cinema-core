from __future__ import annotations

import json
import re
from uuid import uuid4

from loguru import logger

from config import DEEPSEEK_API_KEY
from core.llm_client import call_deepseek

from .models import ArbitrationResult, Claim, Evidence, Gap
from .prompts import ARBITRATOR_SYSTEM_PROMPT, PLANNER_SYSTEM_PROMPT
from .templates import CITY_LABELS, ModuleTemplate


def _extract_json(text: str) -> object:
    match = re.search(r"(\[.*\]|\{.*\})", text, re.DOTALL)
    return json.loads(match.group(1) if match else text)


class PlannerAgent:
    async def plan(self, city: str, modules: list[ModuleTemplate]) -> list[Claim]:
        if DEEPSEEK_API_KEY:
            try:
                allowed = [module.key for module in modules]
                prompt = {
                    "city": CITY_LABELS[city],
                    "allowedCategories": allowed,
                    "maxClaimsPerCategory": 3,
                    "seedClaims": {
                        module.key: [claim.format(city=CITY_LABELS[city]) for claim in module.claim_prompts]
                        for module in modules
                    },
                }
                raw = await call_deepseek(PLANNER_SYSTEM_PROMPT, json.dumps(prompt, ensure_ascii=False), 0.1)
                parsed = _extract_json(raw)
                rows = parsed.get("claims", []) if isinstance(parsed, dict) else parsed
                claims = self._validate_llm_claims(rows, modules)
                if claims:
                    return claims
            except Exception as exc:
                logger.warning(f"Business planner LLM fallback activated: {exc}")
        return self._template_claims(city, modules)

    def _validate_llm_claims(self, rows: object, modules: list[ModuleTemplate]) -> list[Claim]:
        if not isinstance(rows, list):
            return []
        module_map = {module.key: module for module in modules}
        counts: dict[str, int] = {}
        claims: list[Claim] = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            category = str(row.get("category") or "")
            text = str(row.get("text") or "").strip()
            if category not in module_map or not text or counts.get(category, 0) >= 3:
                continue
            counts[category] = counts.get(category, 0) + 1
            claims.append(
                Claim(
                    id=str(uuid4()),
                    text=text,
                    category=category,
                    is_critical=module_map[category].critical,
                )
            )
        return claims

    def _template_claims(self, city: str, modules: list[ModuleTemplate]) -> list[Claim]:
        city_label = CITY_LABELS[city]
        return [
            Claim(
                id=str(uuid4()),
                text=text.format(city=city_label),
                category=module.key,
                is_critical=module.critical,
            )
            for module in modules
            for text in module.claim_prompts[:3]
        ]


class ResearchAgent:
    def build_query(self, claim: Claim, city: str, gaps: list[Gap]) -> str:
        if gaps:
            return gaps[0].suggested_query
        return f"{claim.text} nguồn chính thức cập nhật mới nhất {CITY_LABELS[city]}"


class ArbitratorAgent:
    async def arbitrate(self, claim: Claim, evidence: list[Evidence]) -> ArbitrationResult:
        if not evidence:
            return ArbitrationResult(
                status="insufficient",
                needs_more_evidence=True,
                classification="unknown",
                gaps=[Gap(description="Chưa tìm thấy nguồn", suggested_query=f"{claim.text} nguồn chính thức")],
            )

        if DEEPSEEK_API_KEY:
            try:
                payload = {
                    "claim": claim.text,
                    "evidence": [
                        {"url": item.url, "title": item.title, "snippet": item.snippet}
                        for item in evidence
                    ],
                }
                raw = await call_deepseek(ARBITRATOR_SYSTEM_PROMPT, json.dumps(payload, ensure_ascii=False), 0.0)
                parsed = _extract_json(raw)
                if isinstance(parsed, dict):
                    relations = parsed.get("relations", [])
                    for index, relation in enumerate(relations):
                        if index < len(evidence) and relation in {"supports", "contradicts", "irrelevant"}:
                            evidence[index].relation = relation
            except Exception as exc:
                logger.warning(f"Business arbitrator LLM fallback activated: {exc}")

        supports = sum(item.relation == "supports" for item in evidence)
        contradicts = sum(item.relation == "contradicts" for item in evidence)
        irrelevant = sum(item.relation == "irrelevant" for item in evidence)
        unique_domains = {item.source_domain for item in evidence if item.relation == "supports"}
        if contradicts:
            return ArbitrationResult(
                status="conflicting",
                supports=supports,
                contradicts=contradicts,
                irrelevant=irrelevant,
                classification="conflicting",
            )
        if supports >= 2 and len(unique_domains) >= 2:
            return ArbitrationResult(
                status="resolved",
                supports=supports,
                irrelevant=irrelevant,
                classification="fact",
            )
        return ArbitrationResult(
            status="partial",
            supports=supports,
            irrelevant=irrelevant,
            needs_more_evidence=True,
            classification="inference",
            gaps=[
                Gap(
                    description="Cần thêm nguồn độc lập để corroborate",
                    suggested_query=f"{claim.text} báo cáo nguồn độc lập",
                )
            ],
        )
