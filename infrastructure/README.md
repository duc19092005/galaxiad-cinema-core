# 🏗️ Galaxiad Cinema Core - Infrastructure & Operations Guide

Thư mục `infrastructure/` là trung tâm duy nhất quản lý cấu hình Docker, Dockerfile, Nginx và các script vận hành tự động hóa của toàn bộ hệ thống Galaxiad Cinema Core.

---

## 1. Cấu Trúc Thư Mục

```text
infrastructure/
  docker/
    compose.base.yml       # Định nghĩa dịch vụ cơ sở: SQL Server 2022, Redis, Qdrant
    compose.dev.yml        # Môi trường phát triển cục bộ với volume mount
    compose.prod.yml       # Môi trường Production tối ưu hóa tài nguyên
    compose.test.yml       # Stack kiểm thử tự động, cô lập hoàn toàn (không expose port)
    compose.demo.yml       # Stack demo độc lập với dữ liệu mẫu
    dockerfiles/
      backend.Dockerfile   # Multi-stage build cho .NET 8 ASP.NET Core API
      frontend.Dockerfile  # Multi-stage build cho Vite React + Nginx
      ai.Dockerfile        # Python 3.11 microservice (FastAPI + gRPC)
      test-runner.Dockerfile # Container chạy test tổng hợp (.NET + Pytest + cURL)
    nginx/
      nginx.conf           # Cấu hình Nginx gốc
      conf.d/default.conf  # Reverse proxy với hỗ trợ WebSockets cho SignalR
    env/
      test.env.example     # Biến môi trường cho test stack
      demo.env.example     # Biến môi trường cho demo stack
      prod.env.example     # Biến môi trường mẫu cho production
  scripts/
    test.ps1 / test.sh     # Lệnh chạy kiểm thử (unit, full, live-ai)
    demo.ps1 / demo.sh     # Lệnh chạy kịch bản demo (booking, group, expiry, chatbot)
    reset-test.ps1 / .sh   # Dọn dẹp sạch namespace test (cinema-test)
  README.md
```

---

## 2. Hướng Dẫn Chạy Kiểm Thử Bằng Lệnh (Không Cần GUI)

### A. Chạy Unit Tests (.NET & Python)
Chạy 100% deterministic, không tốn phí external API, hoàn tất trong vài giây:
```powershell
# PowerShell
.\infrastructure\scripts\test.ps1 unit

# Linux / Bash
./infrastructure/scripts/test.sh unit
```

### B. Chạy Toàn Bộ Test Suite (Full: Unit, Integration, Concurrency, API Flows)
Tự động dựng stack `cinema-test` cô lập (SQL Server, Redis, Qdrant thật), chạy toàn bộ ma trận test và dọn dẹp sạch sẽ:
```powershell
# PowerShell
.\infrastructure\scripts\test.ps1 full

# Linux / Bash
./infrastructure/scripts/test.sh full
```

### C. Reset Dữ Liệu Test Stack
Chỉ xóa các container và volume thuộc namespace `cinema-test`, tuyệt đối không ảnh hưởng đến database demo hoặc production:
```powershell
.\infrastructure\scripts\reset-test.ps1
```

---

## 3. Hướng Dẫn Chạy Demo Command-Line

Hệ thống cung cấp các kịch bản demo chạy thẳng từ terminal, log từng bước và trạng thái HTTP:
```powershell
# 1. Luồng đặt vé và giả lập thanh toán VNPay
.\infrastructure\scripts\demo.ps1 booking

# 2. Luồng đặt vé nhóm và bỏ phiếu thanh toán
.\infrastructure\scripts\demo.ps1 group

# 3. Luồng hủy đơn hết hạn và giải phóng ghế/kho
.\infrastructure\scripts\demo.ps1 expiry

# 4. Luồng trợ lý ảo AI Chatbot
.\infrastructure\scripts\demo.ps1 chatbot
```

---

## 4. Hướng Dẫn Chuyển Tiếp Cấu Hình Portainer (Production Transition)

> [!CAUTION]
> **LƯU Ý VỀ TRIỂN KHAI PRODUCTION:**
> Không tự ý deploy hoặc thay đổi trực tiếp trên VPS trong đợt refactor. Khi sẵn sàng bàn giao, thực hiện chuyển tiếp cấu hình Portainer theo các bước sau:

1. **Vị trí Compose mới:**
   Cập nhật đường dẫn file compose trong cấu hình Stack Portainer (Stack #5) từ `docker-compose.prod.yml` sang:
   ```text
   infrastructure/docker/compose.prod.yml
   ```
2. **Quản lý Environment Variables:**
   Sao chép các biến cấu hình từ `infrastructure/docker/env/prod.env.example` vào mục **Environment variables** của Stack trên giao diện Portainer.
3. **Build Context:**
   Đảm bảo Build context trong compose trỏ đúng:
   - Backend: `../../apps/backend`
   - Frontend: `../../apps/frontend`
   - AI Service: `../../services/ai`
   - Nginx: `./nginx/conf.d`
