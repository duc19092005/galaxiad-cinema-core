# Hợp đồng phim và quyền chiếu

Module thay CRUD phim trực tiếp bằng luồng hồ sơ có thể truy vết:

`Admin upload tài liệu → OCR/model tự chạy → (tuỳ chọn) giao MovieManager đối soát → xem trước/sau → Admin ký duyệt → kích hoạt → tạo hoặc liên kết phim, quyền chiếu và chính sách chia doanh thu.`

## Quyền và trạng thái

- **Admin** upload hồ sơ, xem kết quả OCR, lọc theo đối tác, giao (hoặc tự thực hiện) đối soát, phát hành mẫu, duyệt, ký, kích hoạt, đình chỉ/chấm dứt và duyệt yêu cầu đổi metadata. Admin không gửi hồ sơ cho “Admin” nữa; nếu không cần người đối soát, Admin chuyển thẳng sang ký duyệt.
- **MovieManager** chỉ xử lý hồ sơ được giao: upload, chạy lại OCR, sửa bản nháp trích xuất, gửi duyệt và đề xuất đổi metadata. Role này không có quyền thêm, sửa, xóa hoặc bật/tắt phim trực tiếp.
- **TheaterManager** chỉ dùng quyền chiếu đã kích hoạt để lập/công bố lịch đúng rạp, định dạng và thời hạn.

Trạng thái hợp đồng: `DRAFT`, `PENDING_REVIEW`, `READY_TO_SIGN`, `SIGNED`, `ACTIVATED`, `SUSPENDED`, `TERMINATED`, `CANCELLED`. Khi Admin upload PDF/PNG/JPEG, backend lưu bản gốc bất biến và bắt đầu job OCR. Sau OCR, Admin có thể chọn MovieManager đang hoạt động qua `GET /api/contracts/reviewers` rồi giao bằng `POST /api/contracts/{id}/assign`; người được giao chỉ thấy hồ sơ trong phạm vi của mình.

MovieManager sửa bản nháp bằng `PUT /api/contracts/{id}/extraction-review`. Mỗi lần lưu lưu actor, thời điểm, dữ liệu trước/sau và lý do trong revision; UI hiển thị bảng so sánh OCR ban đầu với dữ liệu sau đối soát. MovieManager gửi kết quả bằng `/submit`; Admin duyệt, xác nhận mật khẩu, ký duyệt nội bộ và kích hoạt. Ký duyệt nội bộ là bằng chứng phê duyệt revision, không gọi ảnh chữ ký là chứng thư số.

Trường phạm vi rạp/định dạng dùng ba giá trị: `SPECIFIED`, `NO_ADDITIONAL_RESTRICTION_CONFIRMED`, `UNRESOLVED`. Trường trống không được tự hiểu là không giới hạn hoặc chia 50/50.

## API và danh mục phim

`GET /api/movieManager/movies` vẫn là đường đọc theo phạm vi. Các thao tác ghi phim trực tiếp cũ trả `410 MOVIE_DIRECT_MUTATION_DISABLED`; backend không tạo job, upload hay thay đổi cơ sở dữ liệu cho các request đó.

Các API chính của module là `/api/contracts`, `/api/contract-templates` và `/api/movies/{id}/change-requests`. Chỉ Admin có thể approve/sign/activate hoặc áp dụng yêu cầu thay đổi. Kích hoạt tạo quyền chiếu và chính sách chia doanh thu trong một transaction, có khóa chống áp dụng revision lặp lại.

## OCR, AI và lưu trữ

### OCR được xử lý như thế nào?

1. Admin chọn PDF, PNG hoặc JPEG. Backend kiểm tra phần mở rộng, chữ ký file, dung lượng (25 MB/file; tổng job 50 MB) và số trang (tối đa 50), rồi lưu bản gốc bất biến vào MinIO ở local/test hoặc storage production. Hash SHA-256 xác định đúng tài liệu nguồn.
2. Backend tạo job theo `contractId` và `revisionId`; giao diện không bị khóa và job cũ không thể ghi đè revision mới.
3. Python đọc text layer từng trang bằng `pdfplumber`. Nếu trang không có text dùng được, service render bằng `pypdfium2`, chuyển grayscale/tăng tương phản rồi chạy Tesseract `vie+eng`. Ảnh upload đi cùng đường OCR.
4. Text được giữ theo trang, có phương pháp (`pdf_text`/`ocr`), cảnh báo và nguồn. Người rà soát mở đúng trang thay vì chỉ tin chuỗi text đã ghép.
5. Text có nhãn trang được gửi cho Ollama local `qwen3.5:4b` ở dev/test. Model đề xuất JSON gồm bên cấp quyền/đối tác, số hợp đồng, phim, mô tả, poster URL, đạo diễn, diễn viên, ngày, phạm vi rạp/định dạng, tỷ lệ chia, điều khoản, mâu thuẫn và trường chưa rõ. Tài liệu là dữ liệu không tin cậy; model không có công cụ ghi database.
6. Service kiểm tra schema. JSON sai hoặc thiếu mảng bắt buộc thành `UNRESOLVED`, phản hồi rỗng không được coi là thành công. Thiếu tỷ lệ, ngày, poster hoặc mô tả thì giữ “chưa xác định”, không tự điền 50/50, ngày mặc định hay URL Internet.
7. Frontend đưa giá trị vào bản nháp. Tên rạp/định dạng chỉ thành ID khi khớp catalog; “toàn bộ hệ thống” giữ là không giới hạn riêng. Ngày sai, tuổi chưa có catalog hay tên rạp không khớp đều cần người xử lý.
8. Admin tự đối soát hoặc giao MovieManager. Mỗi lần lưu ghi người sửa, thời gian và dữ liệu trước/sau; UI hiển thị bảng so sánh OCR ban đầu với kết quả chỉnh và text nguồn.
9. Chỉ dữ liệu bắt buộc và chính sách tài chính đã xác nhận mới được gửi/duyệt. OCR không tự tạo phim; phim, quyền chiếu và policy chỉ sinh sau khi Admin ký revision và kích hoạt.
10. Lỗi tạm thời được retry theo job; file lỗi, trang khó đọc hoặc JSON lỗi được giữ cùng mã lỗi, không tạo hồ sơ trùng.

OCR/model là trợ lý bóc tách có dẫn chứng, không phải bên ký hợp đồng hay người tự quyết định pháp lý/tài chính.

Môi trường Development/Testing lưu PDF hợp đồng và asset riêng tư trong MinIO. Production dùng storage hiện hữu phía backend, không công khai URL tài liệu vĩnh viễn. Màn quản lý Admin có bộ lọc đối tác và không bắt nhập đối tác trước OCR; đối tác được nhận diện từ trường “bên cấp quyền/nhà phát hành” rồi Admin xác nhận.

Các trường optional không được tự điền giá trị giả: thiếu mô tả, poster, ngày, phân loại, phạm vi hoặc tỷ lệ sẽ hiện “chưa xác định” và chặn duyệt nếu là điều kiện bắt buộc. Poster chỉ được lưu khi URL/asset xuất hiện trong tài liệu hoặc được người rà soát bổ sung có nguồn. `SPECIFIED` chỉ dùng khi ánh xạ được tên rạp/định dạng; câu “toàn hệ thống” dùng `NO_ADDITIONAL_RESTRICTION_CONFIRMED`, không biến thành tên rạp giả.

Hai PDF trong `sample-contracts/` là dữ liệu demo, có nhãn mô phỏng, tiếng Việt Unicode, đối tác, mô tả và poster URL để kiểm tra OCR. Cột mô tả phim dùng `nvarchar(2048)`; dữ liệu cũ đã lưu dấu `?` cần nạp lại từ nguồn gốc vì database không thể khôi phục ký tự đã mất.

Docker dev/test chạy Ollama với `qwen3.5:4b` và không cần API key. Adapter dùng API native của Ollama, `think: false`, JSON mode và giới hạn output để tránh reasoning dài làm hỏng schema.

## Chạy kiểm thử Docker

```powershell
docker compose -p galaxiad-contract-test -f infrastructure/docker/compose.test.yml up -d --build mssql redis qdrant minio ollama ollama-init ai-http api
docker compose -p galaxiad-contract-test -f infrastructure/docker/compose.test.yml build test-runner
docker compose -p galaxiad-contract-test -f infrastructure/docker/compose.test.yml run --rm --no-deps test-runner python3 -m pytest -q services/ai/tests/test_contract_docker_integration.py
```

Kiểm thử tích hợp không mock MinIO, HTTP client, OCR hoặc model. Nó tạo ảnh hợp đồng, ghi/đọc MinIO thật, gọi OCR/model thật và kiểm tra API hợp đồng từ chối request chưa xác thực.

## Kiểm duyệt test, 07/09/2026

- .NET contract/unit suite: 63 pass.
- Frontend build và OCR mapper: build pass, 3 test pass.
- Python AI: 59 pass; schema OCR bổ sung 5 test pass.
- Docker live workflow: 1 pass với SQL Server, MinIO, OCR, Ollama, API và tài khoản Admin/MovieManager thật; không dùng API key.
- Docker smoke contract: MinIO round-trip, model local, OCR ảnh và API 401; không dùng API key.
- Một số test backend có nhãn `Integration` vẫn dùng `InMemory`/Moq; chúng phù hợp kiểm tra use case nhưng không thay thế test SQL/Redis thật. Test Docker hợp đồng được thêm để lấp khoảng trống này.
- Test frontend pass nhưng còn cảnh báo i18n chưa khởi tạo và React `act`; test Python còn cảnh báo deprecation LangChain. Cần dọn để log CI sạch hơn.
