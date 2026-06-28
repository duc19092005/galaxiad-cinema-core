# Algorithms Overview

This folder contains the product and technical algorithms that should not live in the root README.

## Documents

| Document | Purpose |
| --- | --- |
| [Movie Search Algorithm](movie-search.md) | Explains normal movie search and when SQL is enough. |
| [Movie Recommendation Algorithm](movie-recommendation.md) | Explains behavior-based recommendations, Qdrant, SQL queries, and fallback scoring. |
| [Dynamic Pricing Promotions](pricing-promotions.md) | Explains automatic ticket pricing, weekday bitmask rules, timezone matching, and booking snapshots. |
| [Role-Aware Chatbot Plan](role-aware-chatbot.md) | Explains the planned chatbot flow, role scopes, SQL/RAG routing, and safety rules. |
| [Redis Cache Strategy (Tiếng Việt)](redis-cache-strategy.md) | Giải thích chiến lược Cache-Aside, cấu trúc key và giải thuật xóa cache Redis chủ động. |
| [Shift Scheduling Rules (Tiếng Việt)](shift-schedule-rules.md) | Giải thích thuật toán phân loại ca làm, ràng buộc thời gian rạp mở cửa và chuẩn hóa múi giờ. |


## Core Principle

Use the cheapest reliable retrieval path first:

1. Use deterministic SQL for structured business questions.
2. Use SQL plus a bounded LLM summary for analytical questions over comments or metrics.
3. Use semantic search/RAG only when the user intent depends on meaning, similarity, policy text, or vague natural language.

The LLM should classify intent and write the final explanation. The backend should own authorization, SQL execution, vector search calls, data trimming, and final scope filtering.
