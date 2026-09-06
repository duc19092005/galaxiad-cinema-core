# Hợp đồng phim và quyền chiếu

Module thay CRUD phim trực tiếp bằng luồng hồ sơ có thể truy vết:

`Nhận hợp đồng → OCR/model → MovieManager đối chiếu → Admin duyệt/ký → Admin kích hoạt → tạo hoặc liên kết phim, quyền chiếu và chính sách chia doanh thu.`

## Quyền và trạng thái

- **Admin** phát hành mẫu, duyệt, ký, kích hoạt, đình chỉ/chấm dứt và duyệt yêu cầu đổi metadata.
- **MovieManager** chỉ xử lý hồ sơ được giao: upload, chạy lại OCR, sửa bản nháp trích xuất, gửi duyệt và đề xuất đổi metadata. Role này không có quyền thêm, sửa, xóa hoặc bật/tắt phim trực tiếp.
- **TheaterManager** chỉ dùng quyền chiếu đã kích hoạt để lập/công bố lịch đúng rạp, định dạng và thời hạn.

Trạng thái hợp đồng: `DRAFT`, `PENDING_REVIEW`, `READY_TO_SIGN`, `SIGNED`, `ACTIVATED`, `SUSPENDED`, `TERMINATED`, `CANCELLED`. Mọi hoạt động ký/kích hoạt dùng revision và hash tài liệu; file đối tác gốc không bị thay đổi.

Trường phạm vi rạp/định dạng dùng ba giá trị: `SPECIFIED`, `NO_ADDITIONAL_RESTRICTION_CONFIRMED`, `UNRESOLVED`. Trường trống không được tự hiểu là không giới hạn hoặc chia 50/50.

## API và danh mục phim

`GET /api/movieManager/movies` vẫn là đường đọc theo phạm vi. Các thao tác ghi phim trực tiếp cũ trả `410 MOVIE_DIRECT_MUTATION_DISABLED`; backend không tạo job, upload hay thay đổi cơ sở dữ liệu cho các request đó.

Các API chính của module là `/api/contracts`, `/api/contract-templates` và `/api/movies/{id}/change-requests`. Chỉ Admin có thể approve/sign/activate hoặc áp dụng yêu cầu thay đổi. Kích hoạt tạo quyền chiếu và chính sách chia doanh thu trong một transaction, có khóa chống áp dụng revision lặp lại.

## OCR, AI và lưu trữ

Python service thực hiện đọc PDF text layer, render/OCR scan bằng Tesseract `vie+eng`, sau đó gửi văn bản cho model. Model chỉ đề xuất JSON; dữ liệu phải được người dùng rà soát và Admin duyệt trước khi ảnh hưởng phim hoặc tài chính.

Môi trường Development/Testing lưu PDF hợp đồng và asset riêng tư trong MinIO. Production dùng storage hiện hữu phía backend, không công khai URL tài liệu vĩnh viễn.

Docker dev/test chạy Ollama với `qwen3.5:4b` và không cần API key. Adapter dùng API native của Ollama, `think: false`, JSON mode và giới hạn output để tránh reasoning dài làm hỏng schema.

## Chạy kiểm thử Docker

```powershell
docker compose -p galaxiad-contract-test -f infrastructure/docker/compose.test.yml up -d --build mssql redis qdrant minio ollama ollama-init ai-http api
docker compose -p galaxiad-contract-test -f infrastructure/docker/compose.test.yml build test-runner
docker compose -p galaxiad-contract-test -f infrastructure/docker/compose.test.yml run --rm --no-deps test-runner python3 -m pytest -q services/ai/tests/test_contract_docker_integration.py
```

Kiểm thử tích hợp không mock MinIO, HTTP client, OCR hoặc model. Nó tạo ảnh hợp đồng, ghi/đọc MinIO thật, gọi OCR/model thật và kiểm tra API hợp đồng từ chối request chưa xác thực.

## Kiểm duyệt test, 07/09/2026

- .NET: 71 pass (51 unit, 16 integration, 4 API flow).
- Frontend: 114 pass.
- Python AI: 54 pass, 4 skip (các test Docker chỉ chạy trong test-runner).
- Docker contract: 4 pass, không dùng API key.
- Một số test backend có nhãn `Integration` vẫn dùng `InMemory`/Moq; chúng phù hợp kiểm tra use case nhưng không thay thế test SQL/Redis thật. Test Docker hợp đồng được thêm để lấp khoảng trống này.
- Test frontend pass nhưng còn cảnh báo i18n chưa khởi tạo và React `act`; test Python còn cảnh báo deprecation LangChain. Cần dọn để log CI sạch hơn.
