# Deployment Guide

## Overview

Galaxiad Cinema Core uses a split cloud + VPS architecture:

```
┌─────────────┐      ┌─────────────────────┐
│   Vercel     │─────▶│    VPS (4GB RAM)     │
│  (Frontend)  │      │                      │
│              │      │  ┌───────┐ ┌───────┐ │
│  React SPA   │      │  │  API  │ │  AI   │ │
│  + rewrite   │      │  │ .NET  │ │Python │ │
│              │      │  │ 8080  │ │ 8000  │ │
└─────────────┘      │  └───┬───┘ └───┬───┘ │
                     │      │         │      │
                     │  ┌───┴───┐     │      │
                     │  │ MSSQL │     │      │
                     │  │ 1433  │     │      │
                     │  └───────┘     │      │
                     └────────────────┼──────┘
                                      │
              ┌───────────────────────┼───────────────────┐
              │                       │                   │
    ┌─────────┴─────────┐  ┌─────────┴─────────┐  ┌──────┴──────┐
    │   Redis Cloud     │  │   Qdrant Cloud    │  │   Jina AI   │
    │   (free 30MB)     │  │   (free tier)     │  │  (1M free)  │
    │   Cache & Lock    │  │   Vector DB       │  │  Embedding  │
    └───────────────────┘  └───────────────────┘  └─────────────┘
```

## Production vs Development

| | Development | Production |
|---|---|---|
| Command | `docker compose up --build` | `docker compose -f docker-compose.prod.yml up -d --build` |
| AI Embedding | Local BAAI/bge-m3 (4GB RAM) | Cloud Jina AI (512MB RAM) |
| Redis | Local Docker (128MB) | Cloud free tier (30MB) |
| Qdrant | Local Docker (512MB) | Cloud free tier |
| VPS RAM needed | 8GB | **4GB** |
| Services on VPS | 6 (all) | **3** (API + MSSQL + AI) |

## Prerequisites (Production)

- VPS: Ubuntu 22.04 LTS, **4GB RAM**, 2 vCPU
- Docker + Docker Compose v2
- Cloud accounts: Redis Cloud, Qdrant Cloud, Jina AI (all free tier)
- GitHub account (for CI/CD + Vercel)

## Quick Start (Production)

```bash
# 1. Clone the repo
git clone https://github.com/your-username/galaxiad-cinema-core.git
cd galaxiad-cinema-core

# 2. Create VPS .env file
cp .env.example .env
# Edit .env → set MSSQL_SA_PASSWORD

# 3. Create AI service cloud config
cp services/ai/.env.cloud.example services/ai/.env
# Edit services/ai/.env → fill in:
#   JINA_API_KEY (from jina.ai)
#   QDRANT_URL (from cloud.qdrant.io)
#   QDRANT_API_KEY (from cloud.qdrant.io)
#   DEEPSEEK

# 4. Start production services
docker compose -f docker-compose.prod.yml up -d --build

# 5. Verify
docker compose -f docker-compose.prod.yml ps
```

## Cloud Services Setup

### Redis Cloud (free 30MB)
1. Sign up at redis.com/try-free
2. Create a free database (30MB)
3. Get connection string: `rediss://default:PASSWORD@HOST:PORT`
4. Update `appsettings.Production.json` → `ConnectionStrings.RedisConnection`

### Qdrant Cloud (free tier)
1. Sign up at cloud.qdrant.io
2. Create a free cluster
3. Get URL and API key from dashboard
4. Update `services/ai/.env` → `QDRANT_URL`, `QDRANT_API_KEY`

### Jina AI (free 1M tokens/month)
1. Sign up at jina.ai
2. Get API key from dashboard
3. Update `services/ai/.env` → `JINA_API_KEY`

## Resource Allocation (4GB VPS)

| Service | RAM | CPU | Notes |
|---------|-----|-----|-------|
| API (.NET) | 512MB | 1.0 | Backend REST API |
| AI (Python) | 512MB | 1.0 | Cloud embedding (no local model) |
| MSSQL | 1.5GB | 2.0 | SQL Server 2022 |
| OS + Docker | ~300MB | - | Ubuntu + Docker daemon |
| **Total** | **~2.8GB** | | 1.2GB free headroom |

## Seed Data

The system includes pre-seeded data:
- 5 demo movies (showing + coming soon)
- 3 cinema branches
- 6 auditoriums with seat layouts
- Pricing segments (Student, Adult, VIP)
- Sample scheduling rules

## CI/CD

### GitHub Actions (Build & Test)

Automatic build verification on every push:
- Backend: `dotnet build` (ASP.NET Core 8)
- Frontend: `npm ci && npm run build` (TypeScript + Vite)

### Vercel (Frontend Auto-Deploy)

Frontend auto-deploys from `main` branch via Vercel:
- Build: `npm run build`
- Preview: PR branches get preview URLs
- Production: `main` branch → https://renewcinemaprojectfrontend.vercel.app

## Troubleshooting

### Cloud embedding not working
Check AI service logs:
```bash
docker compose -f docker-compose.prod.yml logs ai
```
Verify JINA_API_KEY is set and valid.

### MSSQL out of memory
SQL Server may crash if RAM is insufficient. Solutions:
1. Add swap space (2GB recommended)
2. Reduce MSSQL memory limit in docker-compose.prod.yml

### SSE connection drops
If clients lose SSE connection frequently:
1. Check CORS config in Program.cs
2. Check Vercel rewrite rules for SSE endpoints

### Frontend not loading
1. Verify Vercel deployment is successful
2. Check Vercel rewrite rules in vercel.json
3. Ensure backend API is accessible from Vercel's edge network
