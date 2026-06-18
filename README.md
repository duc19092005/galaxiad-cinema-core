# 🎬 Galaxiad Cinema Core

Hệ thống đặt vé phim trực tuyến với AI gợi ý phim cá nhân hóa.

## Cấu trúc dự án

```
galaxiad-cinema-core/
├── apps/
│   ├── backend/          # C# ASP.NET Core 8 — REST API
│   └── frontend/         # React + TypeScript + Vite
├── services/
│   └── ai/               # Python FastAPI — AI Recommendation Engine
├── docker-compose.yml    # Orchestrate toàn bộ hệ thống
└── README.md
```

## Công nghệ sử dụng

| Layer | Công nghệ |
|---|---|
| `apps/backend` | C# ASP.NET Core 8, EF Core, SQL Server, Redis, Hangfire |
| `apps/frontend` | React 18, TypeScript, Vite |
| `services/ai` | Python FastAPI, Google Gemini Embedding, NumPy |
| Database | SQL Server 2022, Redis |
| DevOps | Docker, Docker Compose |

## Tính năng chính

- 🎟️ Đặt vé xem phim trực tuyến (VNPay)
- 🤖 Gợi ý phim cá nhân hóa bằng AI (Google Gemini + Euclidean search)
- 💬 Bình luận & đánh giá phim (với AI moderation)
- 👥 Phân quyền RBAC (Admin, Theater Manager, Staff, Customer)
- 📊 Quản lý rạp, phòng chiếu, lịch chiếu, ca làm việc

## Ports

| Service | Port |
|---|---|
| Backend API | 8080 |
| AI Service | 8000 |
| Frontend (dev) | 5173 |
| SQL Server | 1433 |
| Redis | 6379 |

## Chạy dự án

### Yêu cầu
- Docker & Docker Compose
- Google API Key → [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### Setup nhanh

```bash
# 1. Điền Google API Key
echo "GOOGLE_API_KEY=AIza..." > services/ai/.env

# 2. Chạy toàn bộ
docker compose up --build

# 3. Lần đầu: sync phim lên AI service
# POST http://localhost:8080/api/v1/recommendation/sync-movies
# Authorization: Bearer <admin_token>
```

### Development (không Docker)

```bash
# Backend API
cd apps/backend && dotnet run --project ApiLayer

# Frontend
cd apps/frontend && npm install && npm run dev

# AI Service
cd services/ai && pip install -r requirements.txt && python main.py
```
