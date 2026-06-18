# 🎬 Galaxiad Cinema Core — Monorepo

Hệ thống đặt vé phim trực tuyến với AI gợi ý phim cá nhân hóa.

## Cấu trúc dự án

```
galaxiad-cinema-core/
├── backend/          # C# ASP.NET Core 8 — REST API
├── frontend/         # React + TypeScript + Vite — Web App
├── ai_service/       # Python FastAPI — AI Recommendation Engine
└── docker-compose.yml
```

## Công nghệ sử dụng

| Layer | Công nghệ |
|---|---|
| Backend API | C# ASP.NET Core 8, Entity Framework Core, SQL Server |
| Frontend | React 18, TypeScript, Vite |
| AI Service | Python FastAPI, Google Gemini Embedding, NumPy |
| Database | SQL Server 2022, Redis |
| DevOps | Docker, Docker Compose, Hangfire |

## Tính năng chính

- 🎟️ Đặt vé xem phim trực tuyến
- 🤖 Gợi ý phim cá nhân hóa bằng AI (Google Gemini Embedding + Euclidean search)
- 💬 Hệ thống bình luận & đánh giá phim
- 👥 Phân quyền RBAC (Admin, Theater Manager, Staff, Customer)
- 💳 Thanh toán VNPay
- 📱 Responsive Design

## Chạy dự án

### Yêu cầu
- Docker & Docker Compose
- Google API Key (cho AI service)

### Setup

```bash
# 1. Điền API key
echo "GOOGLE_API_KEY=your_key_here" > ai_service/.env

# 2. Chạy toàn bộ
cd backend
docker compose up --build

# 3. Sync phim lên AI (sau khi chạy xong)
# POST http://localhost:8080/api/v1/recommendation/sync-movies
# (cần Bearer token Admin)
```

### Development (không dùng Docker)

```bash
# Backend
cd backend && dotnet run --project ApiLayer

# Frontend  
cd frontend && npm install && npm run dev

# AI Service
cd ai_service && pip install -r requirements.txt && python main.py
```

## Ports

| Service | Port |
|---|---|
| Backend API | 8080 |
| AI Service | 8000 |
| Frontend | 5173 |
| SQL Server | 1433 |
| Redis | 6379 |
