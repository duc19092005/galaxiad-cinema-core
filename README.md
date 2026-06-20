# Galaxiad Cinema Core

Galaxiad Cinema Core is a cinema booking platform with a React frontend, an ASP.NET Core backend, a Python AI recommendation service, SQL Server as the source of truth, Redis for runtime infrastructure, and Qdrant for persistent movie vector search.

## Repository Layout

```text
galaxiad-cinema-core/
├── apps/
│   ├── backend/      # ASP.NET Core 8 API solution
│   └── frontend/     # React + TypeScript + Vite client
├── services/
│   └── ai/           # FastAPI recommendation service
├── docs/
│   └── algorithms/   # search, recommendation, and chatbot design docs
├── docker-compose.yml
└── README.md
```

## Runtime Services

| Service | Purpose | Default Port |
| --- | --- | --- |
| `frontend` | React customer/admin/staff UI | `5173` |
| `api` | ASP.NET Core REST API and SignalR hubs | `8080`, `8081` |
| `ai` | FastAPI embedding and recommendation service | `8000` |
| `qdrant` | Persistent vector database for movie embeddings | `6333`, `6334` |
| `mssql` | SQL Server source-of-truth database | `1433` |
| `redis` | Runtime cache/background infrastructure | `6379` |

## Main Documentation

- [Algorithms Overview](docs/algorithms/README.md)
- [Movie Search Algorithm](docs/algorithms/movie-search.md)
- [Movie Recommendation Algorithm](docs/algorithms/movie-recommendation.md)
- [Role-Aware Chatbot Plan](docs/algorithms/role-aware-chatbot.md)
- [Backend Controller Structure](apps/backend/Cinema.Api/Controllers/README.md)

## Recommendation Algorithm (Thuật toán Gợi ý Phim)

Hệ thống gợi ý phim hoạt động linh hoạt theo hai cơ chế tùy thuộc vào trạng thái cấu hình của hệ thống AI:

* **Khi có Embedding (Gemini API Key hợp lệ)**: 
  Hệ thống hiểu được ngữ nghĩa sở thích của bạn bằng cách phân tích văn bản mô tả (sở thích khảo sát, lịch sử xem, đặt vé, đánh giá) và chuyển thành vector 768 chiều. Sau đó, hệ thống sử dụng cơ sở dữ liệu vector Qdrant để so khớp khoảng cách và tìm các bộ phim tương ứng có nội dung tương đồng ngữ nghĩa nhất.
  
* **Khi không có Embedding (Cơ chế Dự phòng - Fallback)**: 
  Hệ thống chạy thuật toán thống kê hành vi hoàn toàn dưới database SQL cục bộ. Thuật toán này tự động lọc bỏ các phim bạn đã từng tương tác (xem, đặt vé, rate tốt), sau đó tính toán điểm số độ hot của các phim còn lại theo công thức:
  
  ```text
  SimilarityScore = (Số lượt đặt vé * 3) + (Số lượt xem/click * 1) + (Điểm đánh giá trung bình * 10) + (Số lượng đánh giá * 1)
  ```
  
  Và đề xuất các phim có điểm cao nhất để đảm bảo gợi ý cá nhân hóa và bắt kịp xu hướng.

## Backend Structure

```text
apps/backend/
├── Cinema.Api/          # controllers, middleware, bootstrapping, hubs
├── Cinema.Application/  # DTOs, use cases, application services
├── Cinema.Infrastructure/# EF Core DbContext, repositories, persistence, 3rd-party services
└── Cinema.Domain/       # core business logic, entities, enums, interfaces
```

Controller folders are grouped by audience and operational responsibility:

```text
Cinema.Api/Controllers/
├── Admin/
├── Customer/
├── Identity/
├── Management/
└── Staff/
```

## Frontend Structure

```text
apps/frontend/src/
├── components/       # shared UI, layout, auth guards, modals
├── contexts/         # app-level context providers
├── features/         # feature modules by business area
├── i18n/             # translations and i18n wiring
├── types/            # TypeScript domain/API types
└── utils/            # auth, date/time, toast, theme helpers
```

## Development

### Docker

```bash
echo "GOOGLE_API_KEY=your-key" > services/ai/.env
docker compose up --build
```

### Local Backend

```bash
cd apps/backend
dotnet run --project Cinema.Api
```

### Local Frontend

```bash
cd apps/frontend
npm install
npm run dev
```

### Local AI Service

```bash
cd services/ai
pip install -r requirements.txt
python main.py
```

## Verification Commands

```bash
dotnet build apps/backend/Backend.sln
cd apps/frontend && npm run build
cd services/ai && python -m py_compile main.py embedder.py config.py models.py
docker compose config --quiet
```
