from __future__ import annotations

from datetime import datetime, timezone

from .models import ArbitrationResult, Evidence


def calculate_confidence(evidence: list[Evidence], arbitration: ArbitrationResult) -> float:
    supporting_domains = {item.source_domain for item in evidence if item.relation == "supports"}
    source_count = len(supporting_domains)
    if source_count == 0:
        score = 0.0
    elif source_count == 1:
        score = 0.3
    elif source_count == 2:
        score = 0.6
    else:
        score = 0.85

    now = datetime.now(timezone.utc)
    dated_sources = [
        item.published_date.astimezone(timezone.utc)
        for item in evidence
        if item.published_date is not None
    ]
    if dated_sources and all((now - date).days <= 183 for date in dated_sources):
        score += 0.1
    if any((now - date).days > 730 for date in dated_sources):
        score -= 0.15
    if arbitration.contradicts > 0:
        score -= 0.3
    if any(item.domain_trust_tier == "high" for item in evidence):
        score += 0.1

    return round(max(0.0, min(1.0, score)), 2)
