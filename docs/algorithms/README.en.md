# Algorithms Overview

Languages: [English](README.en.md) | [Tiếng Việt](README.vi.md) | [Русский](README.ru.md)

This folder contains the product and technical algorithms used by Galaxiad Cinema.

## Documents

| Document | English | Vietnamese | Russian |
| --- | --- | --- | --- |
| Movie Search Algorithm | [movie-search.md](en/movie-search.md) | [movie-search.md](vi/movie-search.md) | [movie-search.md](ru/movie-search.md) |
| Movie Recommendation Algorithm | [movie-recommendation.md](en/movie-recommendation.md) | [movie-recommendation.md](vi/movie-recommendation.md) | [movie-recommendation.md](ru/movie-recommendation.md) |
| Dynamic Pricing Promotions | [pricing-promotions.md](en/pricing-promotions.md) | [pricing-promotions.md](vi/pricing-promotions.md) | [pricing-promotions.md](ru/pricing-promotions.md) |
| Role-Aware Chatbot | [role-aware-chatbot.md](en/role-aware-chatbot.md) | [role-aware-chatbot.md](vi/role-aware-chatbot.md) | [role-aware-chatbot.md](ru/role-aware-chatbot.md) |
| Redis Cache Strategy | [redis-cache-strategy.md](en/redis-cache-strategy.md) | [redis-cache-strategy.md](vi/redis-cache-strategy.md) | [redis-cache-strategy.md](ru/redis-cache-strategy.md) |
| Shift Scheduling Rules | [shift-schedule-rules.md](en/shift-schedule-rules.md) | [shift-schedule-rules.md](vi/shift-schedule-rules.md) | [shift-schedule-rules.md](ru/shift-schedule-rules.md) |
| **Seat Locking Real-time (SignalR)** 🔥 | **[seat-locking.md](en/seat-locking.md)** | **[seat-locking.md](vi/seat-locking.md)** | **[seat-locking.md](ru/seat-locking.md)** |

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
