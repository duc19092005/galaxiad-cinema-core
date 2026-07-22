from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=lambda value: "".join(
            word if index == 0 else word.capitalize()
            for index, word in enumerate(value.split("_"))
        ),
        populate_by_name=True,
    )


class BusinessResearchRequest(CamelModel):
    job_id: str
    city: Literal["HCM", "HN"]
    analysis_type: Literal["PricingAnalysis", "SiteLocationFeasibility"]
    selected_modules: list[str] = Field(default_factory=list)
    budget_cap: int = Field(default=30, ge=1, le=100)
    notes: str = Field(default="", max_length=1000)


class Claim(CamelModel):
    id: str
    text: str
    category: str
    is_critical: bool
    status: str = "unresolved"
    iteration_count: int = 0
    confidence: float = 0.0
    classification: str = "unknown"
    evidence: list["Evidence"] = Field(default_factory=list)


class Evidence(CamelModel):
    url: str
    title: str
    snippet: str
    extracted_content: str = ""
    published_date: datetime | None = None
    query_used: str
    source_domain: str
    source_type: str
    domain_trust_tier: str
    iteration_added: int
    relation: str = "supports"


class Gap(CamelModel):
    description: str
    suggested_query: str


class ArbitrationResult(CamelModel):
    status: str
    supports: int = 0
    contradicts: int = 0
    irrelevant: int = 0
    needs_more_evidence: bool = False
    classification: str = "unknown"
    gaps: list[Gap] = Field(default_factory=list)


class ResearchEvent(CamelModel):
    event_type: str
    payload: dict[str, Any]


class BusinessResearchResult(CamelModel):
    job_id: str
    status: str
    budget_used: int
    claims: list[Claim]
    report: dict[str, Any]
