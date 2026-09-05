# 🧪 Tài Liệu Kiến Trúc & Danh Mục Kiểm Thử Hệ Thống (Cinema Testing System)

[🇻🇳 Tiếng Việt](README.md) | [🇬🇧 English](README.en.md) | [🇷🇺 Русский](README.ru.md)

Tài liệu này mô tả toàn bộ kiến trúc kiểm thử tự động, danh mục ma trận test case và cơ chế đảm bảo chất lượng liên tục (CI Gate) của **Hệ Thống Quản Lý Rạp Chiếu Phim Toàn Diện (Galaxiad Cinema Core)**.

---

## 1. Nguyên Tắc Cốt Lõi (Core Testing Principles)

1. **Tuyệt đối không giả lập pass (Zero Fake Passes)**: Mọi ca kiểm thử đều chạy code thật, không mock tầng System-Under-Test (SUT).
2. **Xác thực mã hóa thật (Real Cryptographic Signatures)**: Tính toán chữ ký HMAC-SHA512 thực tế cho cổng thanh toán VNPay; kiểm tra token JWT thật với claims phân quyền.
3. **Kiểm thử bất đồng bộ & tranh chấp đồng thời (Concurrency & Race Conditions)**: Kiểm tra Redis seat latching, tranh chấp voucher số lượng có hạn và kiểm tra tính lũy thừa (idempotency) của webhook.
4. **Không rò rỉ dữ liệu đa rạp (Tenancy Isolation)**: Kiểm thử nghiêm ngặt ranh giới dữ liệu giữa các cụm rạp, quản lý rạp A không thể can thiệp lịch chiếu hoặc doanh thu của rạp B.
5. **Cổng kiểm thử tự động bắt buộc trước khi merge vào `main` (CI Quality Gate)**: 100% test case của cả Backend, Frontend và AI Service phải vượt qua trước khi cho phép hợp nhất mã nguồn vào nhánh `main`.

---

## 2. Cấu Trúc Các Bộ Kiểm Thử (Test Suite Structure)

```
galaxiad-cinema-core/
├── apps/backend/
│   ├── Cinema.Testing/             # Fixtures dùng chung, MockJwtTokenHelper, VnPayTestHelper, In-Memory DB
│   ├── Cinema.Tests.Unit/          # 51 Unit tests (Use cases, Controllers, Policies, Services)
│   ├── Cinema.Tests.Integration/   # 16 Integration tests (Database, VNPay HMAC-SHA512, Redis lock, Job)
│   └── Cinema.Tests.ApiFlows/      # 4 API Flows & SignalR CinemaHub real-time lifecycle tests
├── apps/frontend/
│   └── src/__tests__/              # 114 Vitest unit/component tests (19 test files)
│       ├── api/                    # Axios client, token refresh deduplication, interceptors
│       ├── hooks/                  # WebSocket / SignalR seat latching hook (useSeatWs)
│       ├── utils/                  # Seat selection policies, auth utils, segment quantity
│       ├── components/             # ProtectedRoute, Header, navigation
│       └── features/               # ChatBot (action cards), Cashier POS, Booking, Movie, Auth
├── services/ai/
│   └── tests/                      # Pytest suite (FastAPI routers, recommendation embeddings, LLM agent)
└── docs/testing/
    ├── README.md                   # Tổng quan kiểm thử (Tiếng Việt)
    ├── README.en.md                # Testing Overview (English)
    ├── README.ru.md                # Обзор тестирования (Русский)
    ├── catalog.md                  # Ma trận chi tiết 47 test case (Tiếng Việt)
    ├── catalog.en.md               # 47-Case Test Matrix Catalog (English)
    ├── catalog.ru.md               # Каталог матрицы тестирования (Русский)
    ├── inventory.json              # Bản đồ toàn bộ 187 use cases, controllers, services
    ├── testcases.json              # Dữ liệu JSON chi tiết các test case theo phân hệ
    └── testcases.schema.json       # JSON Schema chuẩn hóa cho test catalog
```

---

## 3. Ma Trận Nghiệp Vụ (Business Test Matrix)

Chi tiết 47 ca kiểm thử chuẩn hóa được ghi nhận đầy đủ theo từng ngôn ngữ:
- 🇻🇳 **[Bảng Ma Trận Kiểm Thử Tiếng Việt](catalog.md)**
- 🇬🇧 **[English Test Matrix Catalog](catalog.en.md)**
- 🇷🇺 **[Русская тестовая матрица](catalog.ru.md)**

### Tóm tắt phân loại mức độ ưu tiên:
- **P0 (29 test cases)**: Tiền tệ, thanh toán VNPay, chữ ký số, khóa ghế Redis, phân quyền RBAC đa rạp, dọn dẹp đơn hủy quá hạn.
- **P1 (17 test cases)**: Tạo lịch chiếu, sơ đồ phòng chiếu, đổi ca nhân viên, chấm công khuôn mặt, AI chat & gợi ý phim.
- **P2 (1 test case)**: Bình luận phim, kiểm duyệt ngôn từ AI.

---

## 4. Hướng Dẫn Chạy Kiểm Thử (How to Run Tests)

### Backend (.NET 8):
```bash
dotnet test apps/backend/Backend.sln --logger:"console;verbosity=minimal"
# Kết quả mong đợi: 71/71 tests PASSED (100% GREEN)
```

### Frontend (React 19 + TypeScript + Vitest):
```bash
cd apps/frontend
npm test           # Chạy toàn bộ 114 unit & component tests
npm run build      # Chạy kiểm tra TypeScript strict + Vite production bundle
```

### AI Service (Python 3.11 + Pytest):
```bash
cd services/ai
pytest tests
```

### Tự động hóa qua Docker (Không cần cài SDK cục bộ):
```bash
# Windows PowerShell
./infrastructure/scripts/test.ps1

# Linux / macOS Bash
./infrastructure/scripts/test.sh
```

---

## 5. Cơ Chế CI / Merge Gate vào cả 2 nhánh `dev` và `main`

Quy trình CI trên GitHub Actions (`.github/workflows/build.yml`) chạy tự động khi có Pull Request trỏ vào nhánh `dev`, `develop` hoặc `main`, cũng như khi Push trực tiếp:

1. **`build-backend`**: Build Release và chạy toàn bộ 71 test Backend.
2. **`build-frontend`**: Chạy 114 test Frontend và build bundle production (`npm run build`).
3. **`build-ai`**: Chạy cú pháp và test suite Pytest của AI Service.
4. **`all-tests-passed` (Gate)**: Đảm bảo cả 3 luồng kiểm thử trên đều xanh 100% trước khi cho phép hợp nhất mã nguồn vào `dev` hoặc `main`.

> [!IMPORTANT]
> **Thiết lập Branch Protection trên GitHub cho CẢ `main` VÀ `dev`:**
> Vào mục **Settings** -> **Branches** -> **Add branch protection rule** (thực hiện lần lượt cho cả nhánh `main` và nhánh `dev`):
> - **Branch name pattern**: Điền `main` (tạo rule 1), sau đó làm tiếp với `dev` (tạo rule 2).
> - Chọn **Require status checks to pass before merging**.
> - Tích chọn job: `All Tests Passed Gate (Required for Main & Dev Merge)`.
> Nhờ đó, mọi pull request trỏ vào `dev` lẫn `main` đều bắt buộc phải build thành công và pass 100% tất cả các test.
