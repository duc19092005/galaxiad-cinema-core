from __future__ import annotations

import json
import re
from uuid import uuid4

from loguru import logger

from config import DEEPSEEK_API_KEY
from core.llm_client import call_deepseek

from .models import ArbitrationResult, Claim, Evidence, Gap
from .prompts import ARBITRATOR_SYSTEM_PROMPT, PLANNER_SYSTEM_PROMPT, REPORT_SYSTEM_PROMPT
from .templates import CITY_LABELS, ModuleTemplate

GALAXY_AUTHOR = {
    "name": "Galaxy Cinema Business Research System",
    "affiliation": "Department of Corporate Development, Galaxy Cinema Joint Stock Company",
    "email": "research@cinema.local",
}


def _extract_json(text: str) -> object:
    match = re.search(r"(\[.*\]|\{.*\})", text, re.DOTALL)
    return json.loads(match.group(1) if match else text)


def _strip_urls(text: str) -> str:
    """Ensure body text never contains raw URLs (IEEE body rule)."""
    if not text:
        return ""
    cleaned = re.sub(r"https?://\S+", "", text)
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    return cleaned.strip()


def _valid_citations(text: str, valid_ids: set[int]) -> str:
    """Keep only IEEE [n] citations that exist in the reference registry."""
    def replace(match: re.Match[str]) -> str:
        return match.group(0) if int(match.group(1)) in valid_ids else ""

    return re.sub(r"\[(\d+)\]", replace, text or "")


# Developer / pipeline jargon that must never reach C-level report body.
_JARGON_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bstatus\s*=\s*\w+", re.I), ""),
    (re.compile(r"\bclass\s*=\s*\w+", re.I), ""),
    (re.compile(r"\bconf(?:idence)?\s*=?\s*\d+\s*%?", re.I), ""),
    (re.compile(r"\bconf\s+\d+\s*%", re.I), ""),
    (re.compile(r"\bArbitrator\b", re.I), "đánh giá độc lập"),
    (re.compile(r"\bSynthesizer\b", re.I), "tổng hợp chiến lược"),
    (re.compile(r"\bPlanner\b", re.I), "nhóm phân tích"),
    (re.compile(r"\bTavily(?:\s*/?\s*MCP)?\b", re.I), "nguồn thị trường mở"),
    (re.compile(r"\bDeepSeek\b", re.I), ""),
    (re.compile(r"\bmulti[\s-]?agent\b", re.I), "hệ thống nghiên cứu"),
    (re.compile(r"\bSSE\b", re.I), ""),
    (re.compile(r"\bCall budget\b", re.I), ""),
    (re.compile(r"\bEvidence thô\b", re.I), "minh chứng thị trường"),
    (re.compile(r"\bAudit claim\b", re.I), ""),
    (re.compile(r"\bPhụ lục A[^\n]*", re.I), ""),
    (re.compile(r"Các mẩu evidence tiêu biểu[:：]?", re.I), "Tham chiếu thị trường:"),
    (re.compile(r"Hệ thống kiểm chứng ở mức[^.]*\.", re.I), ""),
    (re.compile(r"Arbitrator xếp loại[^.]*\.", re.I), ""),
    (re.compile(r"\bclaim(?:s|Code| ID)?\b", re.I), "giả thuyết kinh doanh"),
    (re.compile(r"\bVerdict\b", re.I), "kết luận"),
    (re.compile(r"\bAgent\b", re.I), ""),
    (re.compile(r"resolved", re.I), "đã xác nhận"),
    (re.compile(r"insufficient(?:_final)?", re.I), "chưa đủ dữ liệu"),
    (re.compile(r"conflicting", re.I), "có tín hiệu mâu thuẫn"),
]


def _risk_label_from_confidence(confidence: float, status: str, contradicts: int = 0) -> str:
    if status in {"insufficient_final", "unresolved"} or contradicts > 0 and confidence < 0.75:
        return "Rủi ro dữ liệu: Cao — chỉ mang tính định hướng; cần thẩm định bổ sung"
    if confidence >= 0.9 and status == "resolved" and contradicts == 0:
        return "Mức độ tin cậy cao (đối chiếu từ nhiều nguồn thị trường độc lập) · Rủi ro dữ liệu: Thấp"
    if confidence >= 0.7:
        return (
            "Mức độ tin cậy trung bình (cần xác minh qua báo cáo giá độc lập / khảo sát thực địa) "
            "· Rủi ro dữ liệu: Trung bình"
        )
    return "Mức độ tin cậy thấp — chưa đủ để đưa vào base-case tài chính · Rủi ro dữ liệu: Cao"


def _strip_executive_jargon(text: str) -> str:
    cleaned = _strip_urls(text or "")
    for pattern, repl in _JARGON_PATTERNS:
        cleaned = pattern.sub(repl, cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


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


class ReportSynthesizerAgent:
    """C-level Business Feasibility report with IEEE [n] citations only."""

    async def synthesize(
        self,
        *,
        city: str,
        template_label: str,
        notes: str,
        claims: list[Claim],
    ) -> dict:
        city_label = CITY_LABELS.get(city, city)
        bibliography = self._build_bibliography(claims)
        claim_rows = self._build_claim_rows(claims, bibliography["urlToId"])
        stats = {
            "totalClaims": len(claims),
            "resolvedClaims": sum(claim.status == "resolved" for claim in claims),
            "insufficientClaims": sum(claim.status == "insufficient_final" for claim in claims),
            "conflictingClaims": sum(claim.classification == "conflicting" for claim in claims),
            "avgConfidence": round(
                (sum(claim.confidence for claim in claims) / len(claims)) if claims else 0.0,
                2,
            ),
            "referenceCount": len(bibliography["entries"]),
        }

        # Sanitize payload: keep structure for LLM, strip developer-facing phrasing hints.
        executive_matrix_input = [
            {
                "topic": row["text"],
                "module": row["module"],
                "pillar": self._pillar_for_module(row["module"]),
                "riskLabel": _risk_label_from_confidence(
                    float(row["confidence"]), row["status"], int(row["contradicts"])
                ),
                "citations": row["citations"],
                "citationIds": row["citationIds"],
                "marketSnippets": row.get("evidenceSnippets") or [],
                "sourceDomains": row.get("sourceDomains") or [],
            }
            for row in claim_rows
        ]

        if DEEPSEEK_API_KEY and claims:
            try:
                user_payload = {
                    "organization": GALAXY_AUTHOR,
                    "city": city_label,
                    "analysisType": template_label,
                    "managerNotes": notes or "",
                    "runStatsForInternalUseOnly": {
                        "hypothesisCount": stats["totalClaims"],
                        "confirmedCount": stats["resolvedClaims"],
                        "referenceCount": stats["referenceCount"],
                    },
                    "marketFindings": executive_matrix_input,
                    "bibliography": [
                        {
                            "id": entry["id"],
                            "title": entry["title"],
                            "domain": entry["domain"],
                            "url": entry["url"],
                        }
                        for entry in bibliography["entries"]
                    ],
                    "instruction": (
                        "Produce the C-level Business Feasibility Report JSON. "
                        "Apply ABSOLUTE FILTERING RULES. No pipeline jargon, no conf%, no claim IDs. "
                        "Use business risk language. Keep [n] citations. No raw URLs in body."
                    ),
                }
                raw = await call_deepseek(
                    REPORT_SYSTEM_PROMPT,
                    json.dumps(user_payload, ensure_ascii=False),
                    0.2,
                )
                parsed = _extract_json(raw)
                if isinstance(parsed, dict):
                    paper = self._normalize_ieee_paper(
                        parsed,
                        bibliography["entries"],
                        stats,
                        city_label,
                        template_label,
                        notes,
                        claim_rows,
                    )
                    if paper.get("abstract") or paper.get("executiveSummary") or paper.get("resultsAndDiscussion"):
                        return paper
            except Exception as exc:
                logger.warning(f"Executive report synthesizer LLM fallback activated: {exc}")

        return self._fallback_ieee_paper(
            city_label, template_label, notes, claims, bibliography["entries"], stats, claim_rows
        )

    def _build_bibliography(self, claims: list[Claim]) -> dict:
        url_to_id: dict[str, int] = {}
        entries: list[dict] = []
        for claim in claims:
            for item in claim.evidence:
                url = (item.url or "").strip()
                if not url or url in url_to_id:
                    continue
                ref_id = len(entries) + 1
                url_to_id[url] = ref_id
                title = (item.title or item.source_domain or "Untitled source").strip()
                domain = item.source_domain or "web"
                ieee_text = f'[{ref_id}] "{title}", {domain}, [Online]. Available: {url}'
                entries.append(
                    {
                        "id": ref_id,
                        "title": title,
                        "url": url,
                        "domain": domain,
                        "sourceType": item.source_type,
                        "trust": item.domain_trust_tier,
                        "ieeeText": ieee_text,
                    }
                )
        return {"urlToId": url_to_id, "entries": entries}

    def _claim_code(self, claim: Claim, index_in_category: int) -> str:
        return f"{claim.category}_{index_in_category:02d}"

    def _build_claim_rows(self, claims: list[Claim], url_to_id: dict[str, int]) -> list[dict]:
        counters: dict[str, int] = {}
        rows: list[dict] = []
        for claim in claims:
            counters[claim.category] = counters.get(claim.category, 0) + 1
            code = self._claim_code(claim, counters[claim.category])
            ref_ids: list[int] = []
            snippets: list[str] = []
            for item in claim.evidence:
                ref_id = url_to_id.get(item.url)
                if ref_id and ref_id not in ref_ids:
                    ref_ids.append(ref_id)
                bit = (item.snippet or item.extracted_content or item.title or "").strip()
                if bit and len(snippets) < 3:
                    snippets.append(_strip_urls(bit[:280]))
            citation_text = ", ".join(f"[{i}]" for i in ref_ids[:6]) if ref_ids else "—"
            rows.append(
                {
                    "claimCode": code,
                    "claimId": claim.id,
                    "module": claim.category,
                    "text": claim.text,
                    "status": claim.status,
                    "classification": claim.classification,
                    "confidence": claim.confidence,
                    "isCritical": claim.is_critical,
                    "citationIds": ref_ids[:6],
                    "citations": citation_text,
                    "evidenceCount": len(claim.evidence),
                    "supports": sum(item.relation == "supports" for item in claim.evidence),
                    "contradicts": sum(item.relation == "contradicts" for item in claim.evidence),
                    "sourceDomains": list(
                        dict.fromkeys(
                            item.source_domain for item in claim.evidence if item.source_domain
                        )
                    )[:6],
                    "evidenceSnippets": snippets,
                }
            )
        return rows

    def _build_provenance(self, city_label: str, template_label: str, notes: str, claim_rows: list[dict], bibliography: list[dict]) -> dict:
        trust_tiers: dict[str, int] = {}
        for entry in bibliography:
            tier = entry.get("trust") or "unknown"
            trust_tiers[tier] = trust_tiers.get(tier, 0) + 1
        return {
            "city": city_label,
            "analysisType": template_label,
            "managerNotes": _strip_urls(notes),
            "pipeline": ["Planner", "Research/Tavily", "Arbitrator", "Synthesizer"],
            "claimCount": len(claim_rows),
            "referenceCount": len(bibliography),
            "sourceTrustTiers": trust_tiers,
            "sourceDomains": list(dict.fromkeys(entry.get("domain", "web") for entry in bibliography))[:20],
        }

    @staticmethod
    def _build_decision_basis(claim_rows: list[dict]) -> list[dict]:
        return [{
            "claimCode": row["claimCode"], "claim": row["text"], "status": row["status"],
            "classification": row["classification"], "confidence": row["confidence"],
            "supports": row["supports"], "contradicts": row["contradicts"],
            "evidenceCount": row["evidenceCount"], "sourceDomains": row["sourceDomains"],
            "citationIds": row["citationIds"],
        } for row in claim_rows]
    def _pillar_for_module(self, module: str) -> str:
        if module in {"zoning_policy", "investment_incentive"}:
            return "zoning"
        if module in {"real_estate_price", "lease_cost", "pricing", "promotion"}:
            return "cost"
        if module in {"infrastructure_trend", "trend_demand", "competition", "background"}:
            return "infrastructure"
        return "cost"

    def _pillar_title(self, pillar: str) -> str:
        return {
            "zoning": "A. Quy hoạch & địa điểm thương mại",
            "cost": "B. Chi phí mặt bằng & dự phòng vận hành (CapEx / OpEx)",
            "infrastructure": "C. Hạ tầng giao thông & tiềm năng khách hàng (Footfall)",
            "pricing": "D. Giá vé, cạnh tranh & nhu cầu",
        }.get(pillar, pillar)

    def _build_executive_matrix_markdown(self, claim_rows: list[dict]) -> str:
        lines = [
            "| Trụ cột phân tích | Thực trạng & Khảo sát thị trường | Đánh giá rủi ro | Tác động kinh doanh (C-Level Focus) | Nguồn tham chiếu |",
            "| :--- | :--- | :--- | :--- | :--- |",
        ]
        by_pillar: dict[str, list[dict]] = {}
        for row in claim_rows:
            by_pillar.setdefault(self._pillar_for_module(row["module"]), []).append(row)

        for pillar, rows in by_pillar.items():
            title = self._pillar_title(pillar).split(". ", 1)[-1]
            topics = "; ".join(r["text"][:80] for r in rows[:3]).replace("|", "/")
            cites = ", ".join(
                dict.fromkeys(
                    c
                    for r in rows
                    for c in (r["citations"].split(", ") if r["citations"] != "—" else [])
                )
            ) or "—"
            risk = _risk_label_from_confidence(
                float(rows[0]["confidence"]), rows[0]["status"], int(rows[0]["contradicts"])
            )
            impact = (
                "Ảnh hưởng shortlist vị trí, biên độ thuê/CapEx và giả định doanh thu — "
                "chỉ chốt sau thẩm định thực địa & báo giá độc lập."
            )
            lines.append(f"| {title} | {topics} | {risk} | {impact} | {cites} |")
        return "\n".join(lines)

    def _build_detailed_analysis(self, claim_rows: list[dict]) -> str:
        """Executive pillar narrative (no developer jargon)."""
        by_pillar: dict[str, list[dict]] = {}
        for row in claim_rows:
            by_pillar.setdefault(self._pillar_for_module(row["module"]), []).append(row)

        blocks: list[str] = ["## 3. Phân tích chi tiết theo trụ cột kinh doanh"]
        for pillar, rows in by_pillar.items():
            blocks.append(f"\n### {self._pillar_title(pillar)}")
            # Aggregate market reality from top rows
            realities = []
            for row in rows[:4]:
                cites = row["citations"] if row["citations"] != "—" else ""
                snippets = row.get("evidenceSnippets") or []
                snippet = f" Tham chiếu thị trường: «{snippets[0]}»." if snippets else ""
                realities.append(f"- {row['text']} {cites}.{snippet}".strip())
            risk = _risk_label_from_confidence(
                float(rows[0]["confidence"]), rows[0]["status"], int(rows[0]["contradicts"])
            )
            so_what = (
                "Hàm ý chiến lược: dùng làm đầu vào shortlist và stress-test mô hình tài chính; "
                "CapEx/OpEx chỉ khóa sau đàm phán thuê, kiểm tra PCCC/tải trọng sàn và khảo sát footfall."
            )
            if any(r["contradicts"] > 0 or r["status"] != "resolved" for r in rows):
                so_what = (
                    "Hàm ý chiến lược: chưa đủ vững cho cam kết vốn lớn; ưu tiên thẩm định bổ sung "
                    "trước khi đưa vào base-case đầu tư."
                )
            blocks.append(
                f"- **Thực trạng thị trường:**\n" + "\n".join(realities) + "\n"
                f"- **Đánh giá rủi ro & độ tin cậy:** {risk}\n"
                f"- **Tác động tới Galaxy Cinema (CapEx/OpEx/Doanh thu):** {so_what}"
            )
        return "\n".join(blocks)

    def _build_key_findings(self, claim_rows: list[dict], city_label: str) -> list[str]:
        findings: list[str] = []
        ranked = sorted(
            claim_rows,
            key=lambda r: (0 if r.get("isCritical") else 1, -float(r.get("confidence") or 0)),
        )
        for row in ranked[:7]:
            risk = _risk_label_from_confidence(
                float(row["confidence"]), row["status"], int(row["contradicts"])
            )
            cites = row["citations"] if row["citations"] != "—" else ""
            findings.append(
                _strip_executive_jargon(
                    f"Tại {city_label}: {row['text']}. {risk}. {cites}"
                ).strip()
            )
        return findings

    def _build_recommendations(
        self,
        claim_rows: list[dict],
        city_label: str,
        template_label: str,
        notes: str,
    ) -> list[str]:
        recs: list[str] = []
        weak = [r for r in claim_rows if r["status"] != "resolved" or r["contradicts"] > 0]
        strong = [r for r in claim_rows if r["status"] == "resolved" and r["confidence"] >= 0.8]

        if notes.strip():
            recs.append(
                f"P0 (Hành động ngay): Bám định hướng quản lý «{_strip_urls(notes.strip())[:160]}» "
                f"khi lọc shortlist địa điểm tại {city_label}."
            )
        if strong:
            top = strong[0]
            recs.append(
                f"P0 (Hành động ngay): Ưu tiên các cụm vị trí/phân khúc liên quan «{top['text'][:110]}» "
                f"trong shortlist thương lượng {top['citations']}."
            )
        else:
            recs.append(
                f"P0 (Hành động ngay): Lập shortlist 3-5 phương án mặt bằng tại {city_label} "
                "theo tiêu chí quy hoạch – footfall – biên độ thuê."
            )
        recs.append(
            "P1 (Thẩm định chuyên sâu): Rà soát pháp lý, PCCC, tải trọng sàn rạp, "
            "và đàm phán điều khoản thuê (fit-out, phí dịch vụ, điều chỉnh giá)."
        )
        if any(r["module"] in {"pricing", "lease_cost", "real_estate_price"} for r in claim_rows):
            recs.append(
                "P1 (Thẩm định chuyên sâu): Thu thập báo giá thuê độc lập (môi giới + chủ nhà) "
                "để khóa biên độ CapEx/OpEx trước IC."
            )
        if weak:
            recs.append(
                "P1 (Thẩm định chuyên sâu): Bổ sung dữ liệu cho các giả thuyết còn khoảng trống "
                "(nguồn chính thống, phỏng vấn chủ mặt bằng, khảo sát hiện trường)."
            )
        recs.append(
            "P2 (Theo dõi chiến lược): Theo dõi tiến độ Metro/Vành đai và TTTM sắp mở "
            "để điều chỉnh timing mở rạp và dự phóng footfall."
        )
        recs.append(
            f"P2 (Theo dõi chiến lược): Cập nhật giả định doanh thu theo diễn biến cạnh tranh "
            f"và nhu cầu giải trí tại {city_label} sau khi có shortlist."
        )
        return [_strip_executive_jargon(item) for item in recs[:7]]

    def _build_risks(self, claim_rows: list[dict]) -> list[str]:
        risks = [
            "Dữ liệu thị trường mở có thể lỗi thời hoặc mang tính quảng cáo; không thay thế thẩm định pháp lý và kỹ thuật.",
            "Thiếu hợp đồng thuê thực tế (giá net, fit-out, phí dịch vụ) làm biên độ CapEx/OpEx dễ lệch.",
        ]
        if any(r["contradicts"] > 0 for r in claim_rows):
            risks.append("Một số tín hiệu thị trường mâu thuẫn nhau; cần đối chiếu thêm trước khi cam kết vốn.")
        if any(r["status"] != "resolved" for r in claim_rows):
            risks.append("Còn khoảng trống dữ liệu quan trọng — không đưa vào base-case tài chính.")
        risks.append(
            "Chưa có khảo sát hiện trường (lưu lượng, cạnh tranh bán kính 1-3km, PCCC, thông thủy, tải trọng sàn)."
        )
        return [_strip_executive_jargon(item) for item in risks]

    def _normalize_ieee_paper(
        self,
        parsed: dict,
        bibliography: list[dict],
        stats: dict,
        city_label: str,
        template_label: str,
        notes: str,
        claim_rows: list[dict],
    ) -> dict:
        def text(*keys: str) -> str:
            for key in keys:
                value = parsed.get(key)
                if isinstance(value, str) and value.strip():
                    return _strip_executive_jargon(value)
            return ""

        def as_list(value: object) -> list[str]:
            if isinstance(value, list):
                return [_strip_executive_jargon(str(item)) for item in value if str(item).strip()]
            if isinstance(value, str) and value.strip():
                return [_strip_executive_jargon(part) for part in re.split(r"[,;]", value) if part.strip()]
            return []

        authors = parsed.get("authors")
        if not isinstance(authors, list) or not authors:
            authors = [GALAXY_AUTHOR]
        else:
            authors = [
                {
                    "name": str(item.get("name") or GALAXY_AUTHOR["name"]),
                    "affiliation": str(item.get("affiliation") or GALAXY_AUTHOR["affiliation"]),
                    "email": str(item.get("email") or GALAXY_AUTHOR["email"]),
                }
                for item in authors
                if isinstance(item, dict)
            ] or [GALAXY_AUTHOR]

        is_site = "site" in template_label.lower() or "location" in template_label.lower()
        title = text("title") or (
            f"BÁO CÁO ĐÁNH GIÁ KHẢ THI ĐỊA ĐIỂM VÀ MẶT BẰNG MỞ RỘNG RẠP CHIẾU PHIM GALAXY CINEMA TẠI {city_label.upper()}"
            if is_site
            else f"BÁO CÁO ĐÁNH GIÁ KHẢ THI KINH DOANH ({template_label.upper()}) — GALAXY CINEMA TẠI {city_label.upper()}"
        )

        abstract = text("abstract") or text("executiveSummary", "executive_summary")
        executive_summary = text("executiveSummary", "executive_summary") or abstract
        introduction = text("introduction")
        results = text("resultsAndDiscussion", "results_and_discussion", "results")
        conclusion = text("conclusion")
        keywords = as_list(parsed.get("keywords"))
        key_findings = as_list(parsed.get("keyFindings") or parsed.get("key_findings"))
        recommendations = as_list(parsed.get("recommendations"))
        risks = as_list(parsed.get("risksAndUnknowns") or parsed.get("risks_and_unknowns"))
        pillar_zoning = text("pillarZoning", "pillar_zoning")
        pillar_cost = text("pillarCost", "pillar_cost")
        pillar_infra = text("pillarInfrastructure", "pillar_infrastructure")
        pillar_pricing = text("pillarPricing", "pillar_pricing")
        matrix = text("executiveMatrixMarkdown", "executive_matrix_markdown")

        detailed = self._build_detailed_analysis(claim_rows)
        fallback_matrix = self._build_executive_matrix_markdown(claim_rows)

        # Prefer model pillars; otherwise compose executive narrative.
        pillar_parts = [p for p in (pillar_zoning, pillar_cost, pillar_infra, pillar_pricing) if p]
        if pillar_parts:
            composed = "\n\n".join(pillar_parts)
            results = composed if not results or len(results) < 300 else f"{composed}\n\n{results}"
        thin_results = (
            not results
            or len(results) < 350
            or ("Thực trạng" not in results and "Tác động" not in results)
        )
        if thin_results:
            results = detailed
        if not matrix or "Trụ cột phân tích" not in matrix:
            matrix = fallback_matrix

        # Keep matrix inside results section for single reading path.
        if "Trụ cột phân tích" not in results:
            results = (
                f"{results}\n\n## 4. Bảng tổng hợp khả thi địa điểm & chi phí\n\n{matrix}"
            )

        if not key_findings:
            key_findings = self._build_key_findings(claim_rows, city_label)
        if not recommendations:
            recommendations = self._build_recommendations(
                claim_rows, city_label, template_label, notes
            )
        if not risks:
            risks = self._build_risks(claim_rows)
        if not abstract:
            abstract = (
                f"Báo cáo đánh giá khả thi tại {city_label} phục vụ HĐQT Galaxy Cinema: "
                f"tổng hợp {stats['totalClaims']} giả thuyết kinh doanh từ nguồn thị trường mở, "
                f"trong đó {stats['resolvedClaims']} giả thuyết đủ độ tin cậy để định hướng shortlist. "
                f"Kết luận mang tính hỗ trợ quyết định CapEx/OpEx và không thay thế khảo sát thực địa."
            )
            executive_summary = abstract

        valid_ids = {entry["id"] for entry in bibliography}
        used_ids = parsed.get("referenceIdsUsed") or parsed.get("reference_ids_used") or []
        ordered_ids: list[int] = []
        if isinstance(used_ids, list):
            for raw_id in used_ids:
                try:
                    num = int(raw_id)
                except (TypeError, ValueError):
                    continue
                if num in valid_ids and num not in ordered_ids:
                    ordered_ids.append(num)
        for entry in bibliography:
            if entry["id"] not in ordered_ids:
                ordered_ids.append(entry["id"])

        id_to_entry = {entry["id"]: entry for entry in bibliography}
        references = [id_to_entry[i] for i in ordered_ids if i in id_to_entry]

        def clean_body(value: str) -> str:
            return _valid_citations(_strip_executive_jargon(value), valid_ids)

        abstract = clean_body(abstract)
        executive_summary = clean_body(executive_summary)
        introduction = clean_body(introduction)
        results = clean_body(results)
        conclusion = clean_body(conclusion)
        matrix = clean_body(matrix)
        key_findings = [clean_body(item) for item in key_findings]
        recommendations = [clean_body(item) for item in recommendations]
        risks = [clean_body(item) for item in risks]

        risk_overall = _risk_label_from_confidence(
            float(stats["avgConfidence"]),
            "resolved" if stats["resolvedClaims"] else "insufficient_final",
        )

        return {
            "reportStyle": "executive_feasibility",
            "title": title,
            "authors": authors,
            "abstract": abstract,
            "keywords": keywords
            or [
                "khả thi địa điểm",
                city_label,
                "CapEx",
                "OpEx",
                "mặt bằng rạp",
                "footfall",
            ],
            "introduction": introduction,
            "relatedWork": "",
            "methodology": "",
            "resultsAndDiscussion": results,
            "conclusion": conclusion
            or clean_body(
                f"Khuyến nghị: dùng kết quả tại {city_label} để shortlist và thẩm định chuyên sâu, "
                "không chốt cam kết vốn trước site visit và báo giá thuê độc lập."
            ),
            "appendix": "",
            "executiveMatrixMarkdown": matrix,
            "keyFindings": key_findings,
            "recommendations": recommendations,
            "risksAndUnknowns": risks,
            "claimMatrix": claim_rows,
            "provenance": self._build_provenance(city_label, template_label, notes, claim_rows, references),
            "decisionBasis": self._build_decision_basis(claim_rows),
            "references": references,
            "headline": title,
            "executiveSummary": executive_summary,
            "confidenceOverall": (
                "high"
                if stats["resolvedClaims"] >= max(1, int(stats["totalClaims"] * 0.7))
                else "medium"
                if stats["resolvedClaims"]
                else "low"
            ),
            "confidenceNote": risk_overall,
            **stats,
        }

    def _fallback_ieee_paper(
        self,
        city_label: str,
        template_label: str,
        notes: str,
        claims: list[Claim],
        bibliography: list[dict],
        stats: dict,
        claim_rows: list[dict],
    ) -> dict:
        is_site = "site" in template_label.lower() or "location" in template_label.lower()
        title = (
            f"BÁO CÁO ĐÁNH GIÁ KHẢ THI ĐỊA ĐIỂM VÀ MẶT BẰNG MỞ RỘNG RẠP CHIẾU PHIM GALAXY CINEMA TẠI {city_label.upper()}"
            if is_site
            else f"BÁO CÁO ĐÁNH GIÁ KHẢ THI KINH DOANH — GALAXY CINEMA TẠI {city_label.upper()}"
        )

        abstract = (
            f"Báo cáo đánh giá khả thi tại {city_label} cho Ban Điều hành Galaxy Cinema. "
            f"Phạm vi gồm quy hoạch/địa điểm, chi phí mặt bằng (CapEx/OpEx) và hạ tầng–footfall, "
            f"tổng hợp từ {stats['referenceCount']} nguồn thị trường mở. "
            f"{stats['resolvedClaims']}/{stats['totalClaims']} giả thuyết kinh doanh đạt mức tin cậy "
            f"đủ để định hướng shortlist; các khoảng trống còn lại yêu cầu thẩm định thực địa và báo giá độc lập. "
            f"Kết luận mang tính hỗ trợ quyết định đầu tư, không thay thế due diligence kỹ thuật–pháp lý."
        )
        if notes.strip():
            abstract += f" Định hướng quản lý: {_strip_urls(notes.strip())[:180]}."

        first_cites = claim_rows[0]["citations"] if claim_rows else ""
        introduction = (
            f"Mở rộng mạng lưới rạp tại {city_label} đòi hỏi nối quy hoạch, biên độ thuê, "
            f"chi phí vận hành và hạ tầng giao thông thành bức tranh có thể hành động. "
            f"Báo cáo này chuyển các tín hiệu thị trường công khai {first_cites} thành "
            f"khuyến nghị CapEx/OpEx và lộ trình thẩm định cho HĐQT."
        )

        results = self._build_detailed_analysis(claim_rows)
        matrix = self._build_executive_matrix_markdown(claim_rows)
        results = f"{results}\n\n## 4. Bảng tổng hợp khả thi địa điểm & chi phí\n\n{matrix}"

        recommendations = self._build_recommendations(claim_rows, city_label, template_label, notes)
        key_findings = self._build_key_findings(claim_rows, city_label)
        risks = self._build_risks(claim_rows)
        risk_overall = _risk_label_from_confidence(
            float(stats["avgConfidence"]),
            "resolved" if stats["resolvedClaims"] else "insufficient_final",
        )

        conclusion = (
            f"Khuyến nghị đầu tư tại {city_label}: dùng shortlist dựa trên trụ cột đã xác nhận, "
            f"ưu tiên thẩm định pháp lý–PCCC–tải trọng sàn và khóa biên độ thuê trước IC. "
            f"Hạn chế: thiếu dữ liệu hiện trường và hợp đồng thuê thực tế — chưa đủ cho base-case tài chính cuối cùng."
        )

        return {
            "reportStyle": "executive_feasibility",
            "title": title,
            "authors": [GALAXY_AUTHOR],
            "abstract": _strip_executive_jargon(abstract),
            "keywords": [
                "khả thi địa điểm",
                city_label,
                "CapEx",
                "OpEx",
                "mặt bằng rạp",
                "footfall",
            ],
            "introduction": _strip_executive_jargon(introduction),
            "relatedWork": "",
            "methodology": "",
            "resultsAndDiscussion": _strip_executive_jargon(results),
            "conclusion": _strip_executive_jargon(conclusion),
            "appendix": "",
            "executiveMatrixMarkdown": matrix,
            "keyFindings": key_findings,
            "recommendations": recommendations,
            "risksAndUnknowns": risks,
            "claimMatrix": claim_rows,
            "provenance": self._build_provenance(city_label, template_label, notes, claim_rows, bibliography),
            "decisionBasis": self._build_decision_basis(claim_rows),
            "references": bibliography,
            "headline": title,
            "executiveSummary": _strip_executive_jargon(abstract),
            "confidenceOverall": (
                "high"
                if stats["resolvedClaims"] >= max(1, int(stats["totalClaims"] * 0.7))
                else "medium"
                if stats["resolvedClaims"]
                else "low"
            ),
            "confidenceNote": risk_overall,
            **stats,
        }
