# Deployment Guide

## Overview

Galaxiad Cinema Core is deployed in a split architecture:

```
┌─────────────┐      ┌─────────────────────────────────┐
│   Vercel     │─────▶│         VPS (6GB RAM)            │
│  (Frontend)  │      │                                  │
│              │      │  ┌───────┐  ┌───────┐           │
│  React SPA   │      │  │  API  │  │  AI   │           │
│  + Vercel    │      │  │ .NET  │  │Python │           │
│    rewrite   │      │  │ 8080  │  │ 8000  │           │
│              │      │  └───┬───┘  └───┬───┘           │
└─────────────┘      │      │          │                │
                     │  ┌───┴───┐  ┌───┴───┐  ┌──────┐ │
                     │  │ MSSQL │  │ Qdrant│  │Redis │ │
                     │  │ 1433  │  │ 6333  │  │ 6379 │ │
                     │  └───────┘  └───────┘  └──────┘ │
                     └─────────────────────────────────┘
```

## Prerequisites

- VPS: Ubuntu 22.04 LTS, 6GB RAM, 2 vCPU
- Docker + Docker Compose v2
- GitHub account (for CI/CD and Vercel deployment)

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/your-username/galaxiad-cinema-core.git
cd galaxiad-cinema-core

# 2. Create .env file
cp .env.example .env
# Edit .env with your MSSQL password

# 3. Start production services
docker compose -f docker-compose.prod.yml up -d --build

# 4. Wait for AI model to load (~2-3 minutes first time)
docker compose -f docker-compose.prod.yml logs -f ai

# 5. Verify all services are running
docker compose -f docker-compose.prod.yml ps
```

## Service Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| API | http://your-vps-ip:8080 | Backend REST API |
| Swagger | http://your-vps-ip:8080/swagger | API documentation |
| AI Service | http://your-vps-ip:8000 | AI recommendation + chatbot |
| Frontend | https://renewcinemaprojectfrontend.vercel.app | Customer-facing SPA |

## Resource Allocation (6GB VPS)

| Service | RAM | CPU | Notes |
|---------|-----|-----|-------|
| API (.NET) | 512MB | 1.0 | Backend REST API |
| AI (Python) | 4GB | 2.0 | BAAI/bge-m3 embedding model |
| MSSQL | 1.5GB | 2.0 | SQL Server 2022 |
| Redis | 128MB | 0.5 | Cache layer |
| Qdrant | 512MB | 1.0 | Vector database |
| **Total** | **~6.7GB** | | OS uses ~300MB |

> **Note:** Total exceeds 6GB slightly. Add 2GB swap to be safe:
> ```bash
> sudo fallocate -l 2G /swapfile
> sudo chmod 600 /swapfile
> sudo mkswap /swapfile
> sudo swapon /swapfile
> echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
> ```

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

### Manual Backend Deploy

Backend is deployed to runasp.net via manual upload or Git deployment.

## Troubleshooting

### AI service slow on first start
The BAAI/bge-m3 model (~2.2GB) downloads from HuggingFace on first run. Check progress:
```bash
docker compose -f docker-compose.prod.yml logs -f ai
```

### MSSQL out of memory
SQL Server may crash if RAM is insufficient. Solutions:
1. Increase swap space (see above)
2. Reduce MSSQL memory limit in docker-compose.prod.yml
3. Consider using a managed database service

### SSE connection drops
If clients lose SSE connection frequently:
1. Check CORS config in Program.cs
2. Check nginx proxy timeout (default 60s, configured to 600s)
3. Check Vercel rewrite rules for SSE endpoints

### Frontend not loading
1. Verify Vercel deployment is successful
2. Check Vercel rewrite rules in vercel.json
3. Ensure backend API is accessible from Vercel's edge network
