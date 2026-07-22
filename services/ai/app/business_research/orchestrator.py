from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import datetime, timezone
from typing import Any

from .agents import ArbitratorAgent, PlannerAgent, ReportSynthesizerAgent, ResearchAgent
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
        self.synthesizer = ReportSynthesizerAgent()
        self.search_provider = TavilyMcpSearchProvider()

    async def stream(self, request: BusinessResearchRequest) -> AsyncIterator[dict[str, Any]]:
        template = get_template(request.analysis_type)
        modules = resolve_modules(request.analysis_type, request.selected_modules)
        budget_used = 0
        city_label = CITY_LABELS[request.city]

        yield self._event(
            request,
            "planning",
            message=f"Planner đang lập claim cho {city_label} · template {template.label}",
            thought=(
                f"Phân rã bài toán {template.label} tại {city_label} thành các claim "
                f"theo module: {', '.join(m.key for m in modules)}."
            ),
        )
        claims = await self.planner.plan(request.city, modules)
        total_critical = sum(claim.is_critical for claim in claims)
        yield self._event(
            request,
            "thought",
            total_claims=len(claims),
            critical_total=total_critical,
            message=f"Planner tạo {len(claims)} claims ({total_critical} critical)",
            thought=(
                f"Đã có {len(claims)} claims cần kiểm chứng. "
                f"Critical claims: {total_critical}. Bắt đầu vòng research + arbitrator."
            ),
        )
        for claim in claims:
            yield self._event(
                request,
                "claim_created",
                current_module=claim.category,
                current_claim_id=claim.id,
                total_claims=len(claims),
                critical_total=total_critical,
                message=claim.text,
                thought=f"[{claim.category}] Claim mới: {claim.text}",
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
                    thought=(
                        f"Iter {claim.iteration_count}/{MAX_ITER_PER_CLAIM} · "
                        f"Tavily query: «{query}»"
                    ),
                )
                new_evidence = await self.search_provider.search(query, claim.iteration_count)
                budget_used += 1
                known_urls = {item.url for item in claim.evidence}
                added = [item for item in new_evidence if item.url not in known_urls]
                claim.evidence.extend(added)

                top_sources = ", ".join(item.source_domain for item in added[:3]) or "không có nguồn mới"
                yield self._event(
                    request,
                    "evidence_found",
                    current_module=claim.category,
                    current_claim_id=claim.id,
                    resolved_claims=processed,
                    total_claims=len(claims),
                    budget_used=budget_used,
                    message=f"+{len(added)} evidence · {top_sources}",
                    thought=(
                        f"Tavily trả về {len(new_evidence)} kết quả, "
                        f"giữ {len(added)} URL mới. Nguồn: {top_sources}."
                    ),
                )

                yield self._event(
                    request,
                    "arbitrating",
                    current_module=claim.category,
                    current_claim_id=claim.id,
                    budget_used=budget_used,
                    message="Arbitrator đang đối chiếu nguồn và kiểm tra mâu thuẫn",
                    thought=(
                        f"Đối chiếu {len(claim.evidence)} evidence cho claim «{claim.text[:120]}» "
                        f"với DeepSeek arbitrator."
                    ),
                )
                arbitration = await self.arbitrator.arbitrate(claim, claim.evidence)
                confidence = calculate_confidence(claim.evidence, arbitration)
                claim.confidence = confidence
                claim.classification = arbitration.classification
                claim.status = arbitration.status

                yield self._event(
                    request,
                    "thought",
                    current_module=claim.category,
                    current_claim_id=claim.id,
                    budget_used=budget_used,
                    message=(
                        f"Arbitrator → {arbitration.status} · "
                        f"{arbitration.classification} · conf {confidence:.0%}"
                    ),
                    thought=(
                        f"supports={arbitration.supports}, contradicts={arbitration.contradicts}, "
                        f"irrelevant={arbitration.irrelevant}, needs_more={arbitration.needs_more_evidence}."
                    ),
                )

                if arbitration.status in {"resolved", "conflicting"}:
                    break
                if previous_confidence >= 0 and confidence - previous_confidence < CONVERGENCE_THRESHOLD:
                    claim.status = "insufficient_final"
                    break
                previous_confidence = confidence
                gaps = arbitration.gaps
                if gaps:
                    yield self._event(
                        request,
                        "thought",
                        current_module=claim.category,
                        current_claim_id=claim.id,
                        budget_used=budget_used,
                        message=f"Gap: {gaps[0].description}",
                        thought=f"Cần query tiếp: {gaps[0].suggested_query}",
                    )

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
                thought=(
                    f"Kết luận claim [{claim.category}]: status={claim.status}, "
                    f"classification={claim.classification}, confidence={claim.confidence:.0%}, "
                    f"evidence={len(claim.evidence)}."
                ),
            )

        yield self._event(
            request,
            "synthesizing",
            budget_used=budget_used,
            resolved_claims=processed,
            total_claims=len(claims),
            message="Galaxy IEEE synthesizer: Abstract → References [n] (no raw URLs in body)",
            thought=(
                "Soạn technical report chuẩn IEEE cho Galaxy Cinema: citation [1]..[n], "
                "bảng ma trận claim, References đầy đủ URL; body không nhúng hyperlink."
            ),
        )
        report = await self._render_report(request, template.label, claims)
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

    async def _render_report(
        self,
        request: BusinessResearchRequest,
        template_label: str,
        claims: list[Claim],
    ) -> dict[str, Any]:
        ieee_summary = await self.synthesizer.synthesize(
            city=request.city,
            template_label=template_label,
            notes=request.notes,
            claims=claims,
        )

        # Claim/evidence matrix retained for audit UI (appendix), not the primary reading path.
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
                                {
                                    "title": item.title,
                                    "url": item.url,
                                    "sourceType": item.source_type,
                                    "domain": item.source_domain,
                                }
                                for item in claim.evidence
                            ],
                        }
                        for claim in category_claims
                    ],
                }
            )

        paper_title = ieee_summary.get("title") or f"{template_label} - {CITY_LABELS[request.city]}"
        return {
            "title": paper_title,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "notes": request.notes,
            "reportStyle": "ieee",
            "summary": ieee_summary,
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
        stage = {
            "planning": ("planning", "Planner", "Lập claim có thể kiểm chứng."),
            "claim_created": ("planning", "Planner", "Đã tạo claim mới."),
            "researching": ("researching", "Research", "Đang tìm evidence web."),
            "evidence_found": ("researching", "Research", "Đã nhận evidence mới."),
            "arbitrating": ("arbitrating", "Arbitrator", "Đang đối chiếu evidence."),
            "claim_resolved": ("arbitrating", "Arbitrator", "Đã kết luận claim."),
            "claim_insufficient": ("arbitrating", "Arbitrator", "Claim chưa đủ evidence."),
            "synthesizing": ("synthesizing", "Synthesizer", "Đang dựng báo cáo IEEE."),
        }.get(event_type)
        if stage:
            base.setdefault("phase", stage[0])
            base.setdefault("agent", stage[1])
            base.setdefault("activity", stage[2])
        if event_type == "researching" and not base.get("query"):
            message = str(base.get("message") or "")
            base["query"] = message.split(":", 1)[-1].strip() if ":" in message else message
        # Progress is audit activity, never raw model chain-of-thought.
        base.pop("thought", None)
        return {"kind": "event", "eventType": event_type, "payload": base}
