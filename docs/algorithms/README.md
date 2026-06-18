# Algorithms Overview

This folder contains the product and technical algorithms that should not live in the root README.

## Documents

| Document | Purpose |
| --- | --- |
| [Movie Search Algorithm](movie-search.md) | Explains normal movie search and when SQL is enough. |
| [Movie Recommendation Algorithm](movie-recommendation.md) | Explains behavior-based recommendations, Qdrant, SQL queries, and fallback scoring. |
| [Role-Aware Chatbot Plan](role-aware-chatbot.md) | Explains the planned chatbot flow, role scopes, SQL/RAG routing, and safety rules. |

## Core Principle

Use the cheapest reliable retrieval path first:

1. Use deterministic SQL for structured business questions.
2. Use SQL plus a bounded LLM summary for analytical questions over comments or metrics.
3. Use semantic search/RAG only when the user intent depends on meaning, similarity, policy text, or vague natural language.

The LLM should classify intent and write the final explanation. The backend should own authorization, SQL execution, vector search calls, data trimming, and final scope filtering.
