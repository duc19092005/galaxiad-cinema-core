# Algorithms Overview

This folder contains the product and technical algorithms.

## Documents

| Document | English | Vietnamese | Russian |
| --- | --- | --- | --- |
| Movie Search Algorithm | [movie-search.md](movie-search.md) | [movie-search.vi.md](movie-search.vi.md) | [movie-search.ru.md](movie-search.ru.md) |
| Movie Recommendation Algorithm | [movie-recommendation.md](movie-recommendation.md) | [movie-recommendation.vi.md](movie-recommendation.vi.md) | [movie-recommendation.ru.md](movie-recommendation.ru.md) |
| Dynamic Pricing Promotions | [pricing-promotions.md](pricing-promotions.md) | [pricing-promotions.vi.md](pricing-promotions.vi.md) | [pricing-promotions.ru.md](pricing-promotions.ru.md) |
| Role-Aware Chatbot Plan | [role-aware-chatbot.md](role-aware-chatbot.md) | [role-aware-chatbot.vi.md](role-aware-chatbot.vi.md) | [role-aware-chatbot.ru.md](role-aware-chatbot.ru.md) |
| Redis Cache Strategy | [redis-cache-strategy.md](redis-cache-strategy.md) | [redis-cache-strategy.vi.md](redis-cache-strategy.vi.md) | [redis-cache-strategy.ru.md](redis-cache-strategy.ru.md) |
| Shift Scheduling Rules | [shift-schedule-rules.md](shift-schedule-rules.md) | [shift-schedule-rules.vi.md](shift-schedule-rules.vi.md) | [shift-schedule-rules.ru.md](shift-schedule-rules.ru.md) |

## Core Principle

Use the cheapest reliable retrieval path first:

1. Use deterministic SQL for structured business questions.
2. Use SQL plus a bounded LLM summary for analytical questions over comments or metrics.
3. Use semantic search/RAG only when the user intent depends on meaning, similarity, policy text, or vague natural language.

The LLM should classify intent and write the final explanation. The backend should own authorization, SQL execution, vector search calls, data trimming, and final scope filtering.
