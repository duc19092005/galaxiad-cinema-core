# 🧪 Testing Architecture & System Test Catalog (Cinema Testing System)

[🇻🇳 Tiếng Việt](README.md) | [🇬🇧 English](README.en.md) | [🇷🇺 Русский](README.ru.md)

This document describes the automated testing architecture, business test matrix catalog, and CI quality gates of the **Comprehensive Cinema Management System (Galaxiad Cinema Core)**.

---

## 1. Core Testing Principles

1. **Zero Fake Passes**: All test cases execute real code paths without mocking the System-Under-Test (SUT).
2. **Authentic Cryptographic Verification**: Real HMAC-SHA512 checksum validation for VNPay callbacks; authentic JWT claims and token verification.
3. **Concurrency & Race Conditions**: Thorough testing of Redis distributed seat latching, single-remaining voucher redemptions, and webhook idempotency.
4. **Multi-Cinema Tenancy Isolation**: Strict isolation enforcement between cinema branches; a manager at Cinema A cannot modify showtimes or view financials of Cinema B.
5. **Mandatory CI Quality Gate for Merging into `main`**: 100% of Backend, Frontend, and AI Service test suites must pass before any code can merge into the `main` production branch.

---

## 2. Test Suite Architecture

```
galaxiad-cinema-core/
├── apps/backend/
│   ├── Cinema.Testing/             # Shared fixtures, MockJwtTokenHelper, VnPayTestHelper, In-Memory DB
│   ├── Cinema.Tests.Unit/          # 51 Unit tests (Use cases, Controllers, Policies, Services)
│   ├── Cinema.Tests.Integration/   # 16 Integration tests (Database, VNPay HMAC-SHA512, Redis lock, Job)
│   └── Cinema.Tests.ApiFlows/      # 4 API Flows & SignalR CinemaHub real-time lifecycle tests
├── apps/frontend/
│   └── src/__tests__/              # 114 Vitest unit/component tests (19 test suites)
│       ├── api/                    # Axios client, token refresh deduplication, interceptors
│       ├── hooks/                  # WebSocket / SignalR seat latching hook (useSeatWs)
│       ├── utils/                  # Seat selection policies, auth utils, segment quantity
│       ├── components/             # ProtectedRoute, Header, navigation
│       └── features/               # ChatBot (action cards), Cashier POS, Booking, Movie, Auth
├── services/ai/
│   └── tests/                      # Pytest suite (FastAPI routers, recommendation embeddings, LLM agent)
└── docs/testing/
    ├── README.md                   # Testing Overview (Vietnamese)
    ├── README.en.md                # Testing Overview (English)
    ├── README.ru.md                # Testing Overview (Russian)
    ├── catalog.md                  # 47-Case Test Matrix Catalog (Vietnamese)
    ├── catalog.en.md               # 47-Case Test Matrix Catalog (English)
    ├── catalog.ru.md               # 47-Case Test Matrix Catalog (Russian)
    ├── inventory.json              # Complete catalog of 187 use cases, controllers, services
    ├── testcases.json              # Structured JSON test cases by domain area
    └── testcases.schema.json       # JSON Schema validation for the test catalog
```

---

## 3. Business Test Matrix Catalog

The complete 47-case business test matrix is accessible in three languages:
- 🇻🇳 **[Bảng Ma Trận Kiểm Thử Tiếng Việt](catalog.md)**
- 🇬🇧 **[English Test Matrix Catalog](catalog.en.md)**
- 🇷🇺 **[Русская тестовая матрица](catalog.ru.md)**

### Priority Breakdown:
- **P0 (29 test cases)**: Financials, VNPay payment gateway, cryptographic signatures, Redis seat locking, multi-cinema RBAC, expired order background cancellation.
- **P1 (17 test cases)**: Showtime scheduling, auditorium matrix generation, staff shift self-service, facial biometric clock-in, AI customer chat & recommendations.
- **P2 (1 test case)**: Customer movie reviews, AI content moderation.

---

## 4. How to Run Tests

### Backend (.NET 8):
```bash
dotnet test apps/backend/Backend.sln --logger:"console;verbosity=minimal"
# Expected output: 71/71 tests PASSED (100% GREEN)
```

### Frontend (React 19 + TypeScript + Vitest):
```bash
cd apps/frontend
npm test           # Runs all 114 unit & component tests
npm run build      # Executes TypeScript strict validation + Vite production build
```

### AI Service (Python 3.11 + Pytest):
```bash
cd services/ai
pytest tests
```

### Headless Docker Automation (No local SDK required):
```bash
# Windows PowerShell
./infrastructure/scripts/test.ps1

# Linux / macOS Bash
./infrastructure/scripts/test.sh
```

---

## 5. CI / Branch Protection Gate for Both `dev` and `main`

The GitHub Actions CI workflow (`.github/workflows/build.yml`) runs automatically on Pull Requests targeting `dev`, `develop`, or `main`, as well as on direct pushes:

1. **`build-backend`**: Builds Release and executes all 71 .NET backend tests.
2. **`build-frontend`**: Executes all 114 Vitest tests and validates production bundle generation (`npm run build`).
3. **`build-ai`**: Executes syntax verification and the Pytest test suite.
4. **`all-tests-passed` (Gate)**: Blocks any code merge into `dev` or `main` unless all 3 suites are 100% green.

> [!IMPORTANT]
> **Configuring Branch Protection on GitHub for BOTH `main` AND `dev`:**
> Navigate to **Settings** -> **Branches** -> **Add branch protection rule** (repeat for both `main` and `dev`):
> - **Branch name pattern**: Enter `main` (Rule 1), then repeat and enter `dev` (Rule 2).
> - Enable **Require status checks to pass before merging**.
> - Select the status check: `All Tests Passed Gate (Required for Main & Dev Merge)`.
> This guarantees that no pull request can merge into either `dev` or `main` without successfully building and passing all automated tests.
