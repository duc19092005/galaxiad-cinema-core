# Algorithms Overview

Languages: [English](README.md) | [Tiếng Việt](README.vi.md) | [Русский](README.ru.md)

This folder contains the product and technical algorithms used by Galaxiad Cinema.

## Documents

| Document | English | Vietnamese | Russian |
| --- | --- | --- | --- |
| Movie Search Algorithm | [movie-search.md](movie-search.md) | [movie-search.vi.md](movie-search.vi.md) | [movie-search.ru.md](movie-search.ru.md) |
| Movie Recommendation Algorithm | [movie-recommendation.md](movie-recommendation.md) | [movie-recommendation.vi.md](movie-recommendation.vi.md) | [movie-recommendation.ru.md](movie-recommendation.ru.md) |
| Dynamic Pricing Promotions | [pricing-promotions.md](pricing-promotions.md) | [pricing-promotions.vi.md](pricing-promotions.vi.md) | [pricing-promotions.ru.md](pricing-promotions.ru.md) |
| Role-Aware Chatbot Plan | [role-aware-chatbot.md](role-aware-chatbot.md) | [role-aware-chatbot.vi.md](role-aware-chatbot.vi.md) | [role-aware-chatbot.ru.md](role-aware-chatbot.ru.md) |
| Redis Cache Strategy | [redis-cache-strategy.md](redis-cache-strategy.md) | [redis-cache-strategy.vi.md](redis-cache-strategy.vi.md) | [redis-cache-strategy.ru.md](redis-cache-strategy.ru.md) |
| Shift Scheduling Rules | [shift-schedule-rules.md](shift-schedule-rules.md) | [shift-schedule-rules.vi.md](shift-schedule-rules.vi.md) | [shift-schedule-rules.ru.md](shift-schedule-rules.ru.md) |

## AI Showtime Planner

The AI Showtime Planner recommends movie schedules for Theater Managers and Admins. It does not train a custom model in V1. The backend scores real business data with deterministic rules, stores recommendation and apply history, and only uses the LLM for natural-language explanation through chatbot integration.

Main inputs:

1. Paid ticket trend, occupancy, and revenue.
2. Movie view/search signals when available.
3. Ratings and comments.
4. Movie release freshness and active screening date range.
5. Auditorium capacity, supported formats, and existing schedule conflicts.
6. Prime-time windows, including weekday evenings and stronger weekend slots.

Main guarantees:

1. The LLM never creates schedules directly.
2. Managers must preview recommendations before applying them.
3. Apply always revalidates movie authorization, movie format support, active date range, past time, auditorium conflicts, and the cleanup gap.
4. Applied, dismissed, failed validation, and viewed actions are stored for audit and future improvement.

## Core Principle

Use the cheapest reliable retrieval path first:

1. Use deterministic SQL for structured business questions.
2. Use SQL plus a bounded LLM summary for analytical questions over comments or metrics.
3. Use semantic search/RAG only when the user intent depends on meaning, similarity, policy text, or vague natural language.

The LLM should classify intent and write the final explanation. The backend should own authorization, SQL execution, vector search calls, data trimming, and final scope filtering.
