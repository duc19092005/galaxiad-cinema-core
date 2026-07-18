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
    """IEEE-style Galaxy Cinema technical report with [n] citations only in body."""

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

        if DEEPSEEK_API_KEY and claims:
            try:
                user_payload = {
                    "organization": GALAXY_AUTHOR,
                    "city": city_label,
                    "analysisType": template_label,
                    "managerNotes": notes or "",
                    "stats": stats,
                    "claimMatrix": claim_rows,
                    "bibliography": [
                        {
                            "id": entry["id"],
                            "title": entry["title"],
                            "domain": entry["domain"],
                            # URL provided only for REFERENCE construction, not for body text.
                            "url": entry["url"],
                        }
                        for entry in bibliography["entries"]
                    ],
                    "instruction": (
                        "Write a Galaxy Cinema IEEE-style research report in Vietnamese. "
                        "Body/table citations must be [id] only. Never put URLs in body fields. "
                        "resultsAndDiscussion MUST contain a Markdown claim evaluation matrix table."
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
                        claim_rows,
                    )
                    if paper.get("abstract") and paper.get("resultsAndDiscussion"):
                        return paper
            except Exception as exc:
                logger.warning(f"IEEE report synthesizer LLM fallback activated: {exc}")

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
            for item in claim.evidence:
                ref_id = url_to_id.get(item.url)
                if ref_id and ref_id not in ref_ids:
                    ref_ids.append(ref_id)
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
                }
            )
        return rows

    def _build_claim_matrix_markdown(self, claim_rows: list[dict]) -> str:
        lines = [
            "### BẢNG I: MA TRẬN ĐÁNH GIÁ VÀ KIỂM CHỨNG CÁC GIẢ THUYẾT VỊ TRÍ (CLAIM EVALUATION MATRIX)",
            "",
            "| Mã giả thuyết (Claim ID) | Nội dung phân tích khả thi vị trí (Feasibility Content) | Trạng thái (Status) | Loại (Class) | Độ tin cậy (Conf) | Tài liệu trích dẫn (Citations) |",
            "| :--- | :--- | :---: | :---: | :---: | :---: |",
        ]
        for row in claim_rows:
            conf = f"{int(round(float(row['confidence']) * 100))}%"
            status = str(row["status"]).replace("insufficient_final", "Insufficient").title()
            if status.lower() == "resolved":
                status = "Resolved"
            classification = str(row["classification"]).title()
            text = str(row["text"]).replace("|", "/")
            lines.append(
                f"| **{row['claimCode']}** | {text} | {status} | {classification} | {conf} | {row['citations']} |"
            )
        return "\n".join(lines)

    def _normalize_ieee_paper(
        self,
        parsed: dict,
        bibliography: list[dict],
        stats: dict,
        city_label: str,
        template_label: str,
        claim_rows: list[dict],
    ) -> dict:
        def text(*keys: str) -> str:
            for key in keys:
                value = parsed.get(key)
                if isinstance(value, str) and value.strip():
                    return _strip_urls(value.strip())
            return ""

        def as_list(value: object) -> list[str]:
            if isinstance(value, list):
                return [str(item).strip() for item in value if str(item).strip()]
            if isinstance(value, str) and value.strip():
                return [part.strip() for part in re.split(r"[,;]", value) if part.strip()]
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

        title = text("title") or (
            f"SITE AND LOCATION FEASIBILITY ANALYSIS FOR CINEMA EXPANSION IN "
            f"{city_label.upper()}: A MULTI-AGENT COMPREHENSIVE APPROACH"
            if "site" in template_label.lower() or "location" in template_label.lower()
            else f"{template_label.upper()} ANALYSIS FOR GALAXY CINEMA IN {city_label.upper()}: A MULTI-AGENT APPROACH"
        )

        abstract = text("abstract")
        introduction = text("introduction")
        related = text("relatedWork", "related_work")
        methodology = text("methodology")
        results = text("resultsAndDiscussion", "results_and_discussion", "results")
        conclusion = text("conclusion")
        appendix = text("appendix")
        keywords = as_list(parsed.get("keywords"))

        # Force matrix table into results if model omitted it.
        matrix = self._build_claim_matrix_markdown(claim_rows)
        if results and "BẢNG I" not in results and "| Mã giả thuyết" not in results:
            results = f"{matrix}\n\n### Phân tích chuyên sâu từ kết quả thực nghiệm:\n{results}"
        elif not results:
            results = matrix

        if not appendix:
            appendix = self._build_appendix(claim_rows)

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
        # Always include every bibliography entry for audit completeness.
        for entry in bibliography:
            if entry["id"] not in ordered_ids:
                ordered_ids.append(entry["id"])

        id_to_entry = {entry["id"]: entry for entry in bibliography}
        references = [id_to_entry[i] for i in ordered_ids if i in id_to_entry]

        confidence = (
            "high"
            if stats["resolvedClaims"] >= max(1, int(stats["totalClaims"] * 0.7))
            else "medium"
            if stats["resolvedClaims"]
            else "low"
        )

        return {
            "reportStyle": "ieee",
            "title": title,
            "authors": authors,
            "abstract": abstract,
            "keywords": keywords
            or [
                template_label,
                city_label,
                "cinema expansion",
                "Tavily Search",
                "multi-agent system",
                "IEEE report",
            ],
            "introduction": introduction,
            "relatedWork": related,
            "methodology": methodology,
            "resultsAndDiscussion": results,
            "conclusion": conclusion,
            "appendix": appendix,
            "claimMatrix": claim_rows,
            "references": references,
            "headline": title,
            "executiveSummary": abstract,
            "confidenceOverall": confidence,
            "confidenceNote": (
                f"Resolved {stats['resolvedClaims']}/{stats['totalClaims']}, "
                f"avg confidence {stats['avgConfidence']:.0%}, "
                f"{len(references)} IEEE references (URLs only in References)."
            ),
            **stats,
        }

    def _build_appendix(self, claim_rows: list[dict]) -> str:
        lines = [
            "PHỤ LỤC (APPENDIX) - CƠ SỞ DỮ LIỆU ĐỐI CHIẾU THÔ (RAW AUDIT MATRIX)",
            "Phần này lưu trữ lịch sử đối sánh thô phục vụ quy trình hậu kiểm toán dữ liệu hệ thống.",
            "",
        ]
        for row in claim_rows:
            cites = row["citations"] if row["citations"] != "—" else "không có citation"
            lines.append(
                f"* **[{row['claimCode']}]** -> {row['text']} "
                f"(status={row['status']}, class={row['classification']}, conf={int(row['confidence']*100)}%) · {cites}."
            )
        return "\n".join(lines)

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
        title = (
            f"SITE AND LOCATION FEASIBILITY ANALYSIS FOR CINEMA EXPANSION IN "
            f"{city_label.upper()}: A MULTI-AGENT COMPREHENSIVE APPROACH"
            if "site" in template_label.lower() or "location" in template_label.lower()
            else f"{template_label.upper()} FOR GALAXY CINEMA IN {city_label.upper()}: A MULTI-AGENT APPROACH"
        )

        abstract = (
            f"Bài báo trình bày kết quả nghiên cứu từ hệ thống multi-agent về {template_label} "
            f"phục vụ chiến lược mở rộng mạng lưới rạp chiếu phim tại {city_label}. "
            f"Hệ thống đã lập {stats['totalClaims']} giả thuyết cốt lõi (claims), thu thập minh chứng "
            f"thời gian thực từ môi trường web (Tavily Search/MCP), đối chiếu độc lập thông qua arbitrator "
            f"và tổng hợp theo khung chuẩn IEEE. Kết quả thực nghiệm cho thấy {stats['resolvedClaims']}/"
            f"{stats['totalClaims']} giả thuyết được giải quyết (độ tin cậy trung bình "
            f"{stats['avgConfidence']:.0%}). Dữ liệu đầu ra hỗ trợ định hướng lựa chọn địa điểm chiến lược "
            f"và tối ưu chi phí vận hành, đồng thời chỉ rõ giới hạn dữ liệu online và hướng khảo sát thực địa."
        )

        first_cites = claim_rows[0]["citations"] if claim_rows else ""
        introduction = (
            f"Việc mở rộng mạng lưới rạp chiếu phim tại thị trường năng động như {city_label} đòi hỏi "
            f"phân tích đa chiều gồm quy hoạch đô thị, biên độ giá thuê mặt bằng thương mại, chi phí vận hành "
            f"và động lực hạ tầng giao thông. Trong nghiên cứu này, các giả thuyết về tính khả thi vị trí "
            f"được kiểm chứng dựa trên nguồn dữ liệu số công khai {first_cites}. "
            f"Bằng mô hình Multi-Agent phối hợp, nghiên cứu hướng tới giảm thiểu rủi ro đầu tư cho Galaxy Cinema."
        )
        if notes.strip():
            introduction += f" Ghi chú định hướng quản lý: {_strip_urls(notes.strip())[:240]}."

        related_bits = []
        for entry in bibliography[:8]:
            related_bits.append(
                f"Nguồn [{entry['id']}] ({entry['domain']}) cung cấp tham chiếu «{entry['title'][:90]}»."
            )
        related = " ".join(related_bits) or (
            "Các báo cáo thị trường và nguồn quy hoạch công khai tạo nền tảng cho bài toán tối ưu vị trí rạp."
        )

        methodology = (
            "Phương pháp luận dựa trên kiến trúc Multi-Agent gồm bốn giai đoạn:\n"
            "1. Planner Agent: phân rã bài toán thành các claims theo module phân tích.\n"
            "2. Research Agent: dùng Tavily Search/MCP để trích xuất evidence web.\n"
            "3. Arbitrator Agent: gán Supports/Contradicts/Irrelevant và tính confidence.\n"
            "4. Synthesizer Agent: dựng báo cáo IEEE và đánh số citation theo bibliography.\n\n"
            f"Thống kê chu kỳ chạy: total={stats['totalClaims']}, resolved={stats['resolvedClaims']}, "
            f"insufficient={stats['insufficientClaims']}, conflicting={stats['conflictingClaims']}, "
            f"references={stats['referenceCount']}."
        )

        matrix = self._build_claim_matrix_markdown(claim_rows)
        deep_dive = []
        for row in claim_rows[:4]:
            deep_dive.append(
                f"* **{row['claimCode']}**: {row['text']} — {row['status']}, "
                f"{row['classification']}, conf {int(row['confidence']*100)}% {row['citations']}."
            )
        results = (
            f"{matrix}\n\n### Phân tích chuyên sâu từ kết quả thực nghiệm:\n"
            + ("\n".join(deep_dive) if deep_dive else "Chưa đủ dữ liệu phân tích chuyên sâu.")
        )

        conclusion = (
            f"Nghiên cứu đã ứng dụng multi-agent để thẩm định sơ bộ {template_label} của Galaxy Cinema tại "
            f"{city_label}, quét {stats['referenceCount']} tài liệu web. Hạn chế: độ sâu mặt bằng cụ thể "
            f"và thiếu khảo sát kỹ thuật thực địa (thông thủy, PCCC, tải trọng sàn). "
            f"Hướng phát triển: site visit, phỏng vấn chủ mặt bằng, và tăng cường nguồn .gov.vn."
        )

        appendix = self._build_appendix(claim_rows)
        confidence = (
            "high"
            if stats["resolvedClaims"] >= max(1, int(stats["totalClaims"] * 0.7))
            else "medium"
            if stats["resolvedClaims"]
            else "low"
        )

        return {
            "reportStyle": "ieee",
            "title": title,
            "authors": [GALAXY_AUTHOR],
            "abstract": abstract,
            "keywords": [
                template_label,
                city_label,
                "cinema expansion",
                "Tavily Search",
                "multi-agent system",
                "IEEE report",
            ],
            "introduction": _strip_urls(introduction),
            "relatedWork": _strip_urls(related),
            "methodology": methodology,
            "resultsAndDiscussion": results,
            "conclusion": conclusion,
            "appendix": appendix,
            "claimMatrix": claim_rows,
            "references": bibliography,
            "headline": title,
            "executiveSummary": abstract,
            "confidenceOverall": confidence,
            "confidenceNote": (
                f"Fallback IEEE Galaxy template · resolved {stats['resolvedClaims']}/{stats['totalClaims']} · "
                f"{len(bibliography)} refs"
            ),
            **stats,
        }
