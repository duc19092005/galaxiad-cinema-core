from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import datetime, timezone
from typing import Any

from .agents import ArbitratorAgent, PlannerAgent, ResearchAgent
from .models import BusinessResearchRequest, BusinessResearchResult, Claim, Gap
from .scoring import calculate_confidence
from .tavily_mcp import TavilyMcpSearchProvider
from .templates import CITY_LABELS, get_template, resolve_modules


MAX_ITER_PER_CLAIM = 3
CONVERGENCE_THRESHOLD = 0.05


class BusinessResearchOrchestrator:
    def __init__(self) -> None:
        self.planner = PlannerAgent()
        self.researcher = ResearchAgent()
        self.arbitrator = ArbitratorAgent()
        self.search_provider = TavilyMcpSearchProvider()

    async def stream(self, request: BusinessResearchRequest) -> AsyncIterator[dict[str, Any]]:
        template = get_template(request.analysis_type)
        modules = resolve_modules(request.analysis_type, request.selected_modules)
        budget_used = 0

        yield self._event(request, "planning", message="Đang lập danh sách claim theo template")
        claims = await self.planner.plan(request.city, modules)
        total_critical = sum(claim.is_critical for claim in claims)
        for claim in claims:
            yield self._event(
                request,
                "claim_created",
                current_module=claim.category,
                current_claim_id=claim.id,
                total_claims=len(claims),
                critical_total=total_critical,
                message=claim.text,
            )

        processed = 0
        for claim in claims:
            previous_confidence = -1.0
            gaps: list[Gap] = []
            while claim.iteration_count < MAX_ITER_PER_CLAIM and budget_used < request.budget_cap:
                claim.iteration_count += 1
                query = self.researcher.build_query(claim, request.city, gaps)
                yield self._event(
                    request,
                    "researching",
                    current_module=claim.category,
                    current_claim_id=claim.id,
                    resolved_claims=processed,
                    total_claims=len(claims),
                    budget_used=budget_used,
                    message=f"Đang research: {query}",
                )
                new_evidence = await self.search_provider.search(query, claim.iteration_count)
                budget_used += 1
                known_urls = {item.url for item in claim.evidence}
                claim.evidence.extend(item for item in new_evidence if item.url not in known_urls)

                yield self._event(
                    request,
                    "arbitrating",
                    current_module=claim.category,
                    current_claim_id=claim.id,
                    budget_used=budget_used,
                    message="Đang đối chiếu nguồn và kiểm tra mâu thuẫn",
                )
                arbitration = await self.arbitrator.arbitrate(claim, claim.evidence)
                confidence = calculate_confidence(claim.evidence, arbitration)
                claim.confidence = confidence
                claim.classification = arbitration.classification
                claim.status = arbitration.status

                if arbitration.status in {"resolved", "conflicting"}:
                    break
                if previous_confidence >= 0 and confidence - previous_confidence < CONVERGENCE_THRESHOLD:
                    claim.status = "insufficient_final"
                    break
                previous_confidence = confidence
                gaps = arbitration.gaps

            if claim.status not in {"resolved", "conflicting"}:
                claim.status = "insufficient_final"
                if not claim.evidence:
                    claim.classification = "unknown"
            processed += 1
            event_type = "claim_resolved" if claim.status == "resolved" else "claim_insufficient"
            yield self._event(
                request,
                event_type,
                current_module=claim.category,
                current_claim_id=claim.id,
                resolved_claims=processed,
                total_claims=len(claims),
                critical_resolved=sum(
                    item.is_critical and item.status == "resolved" for item in claims
                ),
                critical_total=total_critical,
                budget_used=budget_used,
                message=f"{claim.status}: confidence {claim.confidence:.0%}",
            )

        yield self._event(request, "synthesizing", budget_used=budget_used, message="Đang dựng báo cáo có citation")
        report = self._render_report(request, template.label, claims)
        result = BusinessResearchResult(
            job_id=request.job_id,
            status="done",
            budget_used=budget_used,
            claims=claims,
            report=report,
        )
        yield {
            "kind": "result",
            "result": result.model_dump(mode="json", by_alias=True),
        }

    def _render_report(
        self,
        request: BusinessResearchRequest,
        template_label: str,
        claims: list[Claim],
    ) -> dict[str, Any]:
        sections = []
        for category in dict.fromkeys(claim.category for claim in claims):
            category_claims = [claim for claim in claims if claim.category == category]
            sections.append(
                {
                    "module": category,
                    "claims": [
                        {
                            "claimId": claim.id,
                            "text": claim.text,
                            "status": claim.status,
                            "classification": claim.classification,
                            "confidence": claim.confidence,
                            "citations": [
                                {"title": item.title, "url": item.url, "sourceType": item.source_type}
                                for item in claim.evidence
                            ],
                        }
                        for claim in category_claims
                    ],
                }
            )
        return {
            "title": f"{template_label} - {CITY_LABELS[request.city]}",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "notes": request.notes,
            "summary": {
                "totalClaims": len(claims),
                "resolvedClaims": sum(claim.status == "resolved" for claim in claims),
                "insufficientClaims": sum(claim.status == "insufficient_final" for claim in claims),
                "conflictingClaims": sum(claim.classification == "conflicting" for claim in claims),
            },
            "sections": sections,
        }

    def _event(self, request: BusinessResearchRequest, event_type: str, **payload: Any) -> dict[str, Any]:
        base = {
            "jobId": request.job_id,
            "status": event_type,
            "budgetCap": request.budget_cap,
            "budgetUsed": payload.pop("budget_used", 0),
        }
        base.update(
            {
                "".join(word if index == 0 else word.capitalize() for index, word in enumerate(key.split("_"))): value
                for key, value in payload.items()
            }
        )
        return {"kind": "event", "eventType": event_type, "payload": base}
