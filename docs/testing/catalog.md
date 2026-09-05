# 📋 Danh Mục Ma Trận Kiểm Thử Hệ Thống (Cinema Test Catalog)

[🇻🇳 Tiếng Việt](catalog.md) | [🇬🇧 English](catalog.en.md) | [🇷🇺 Русский](catalog.ru.md)

> **Phiên bản:** 1.0.0  
> **Ngày tạo:** 2026-09-05  
> **Nguyên tắc cốt lõi:** Tuyệt đối không ghi "Passed" giả lập; kết quả thực thi được xuất riêng theo từng run; mọi lỗi phát hiện được báo cáo minh bạch.

## 1. Thống Kê Tổng Quan

- **Tổng số Test Case đã chuẩn hóa:** 47
- **Mức độ ưu tiên P0 (Tiền, Quyền, Ghế, Kho, Concurrency):** 29
- **Mức độ ưu tiên P1 (Luồng chính, Quản trị, Lịch chiếu, AI):** 17
- **Mức độ ưu tiên P2 (Phụ trợ, Bình luận, Tương tác):** 1
- **Số test concurrency / race condition:** 5
- **Số test live AI riêng biệt:** 1

## 2. Bảng Ma Trận Nghiệp Vụ Chi Tiết

| STT | Mã Test Case | Phân Hệ & Use Case | Mức Ưu Tiên | Loại Test | Mục Đích Nghiệp Vụ Bảo Vệ | Tác Động Cấm Xảy Ra | Test Automation |
|:---:|:---|:---|:---:|:---:|:---|:---|:---|
| 1 | `AUTH-ACC-001` | **IdentityAccess**<br>_RegisterRegularUseCase_ | **P0** | `unit` | Đăng ký tài khoản khách hàng mới với dữ liệu hợp lệ (tên, email, password mạnh, tuổi > 13) | Không lưu plain-text password<br>Không gán quyền Admin/Staff cho đăng ký công khai | `RegisterRegularUseCase_ValidData_CreatesCustomerSuccessfully` |
| 2 | `AUTH-ACC-002` | **IdentityAccess**<br>_RegisterRegularUseCase_ | **P0** | `unit` | Chặn đăng ký khi trùng email | Không ghi đè hoặc sửa đổi tài khoản hiện có | `RegisterRegularUseCase_DuplicateEmail_ThrowsAppException` |
| 3 | `AUTH-ACC-003` | **IdentityAccess**<br>_LoginRegularUseCase_ | **P0** | `unit` | Đăng nhập với email và mật khẩu đúng, trả về JWT có đầy đủ claims | Không trả về hash mật khẩu hoặc secret server | `LoginRegularUseCase_CorrectCredentials_ReturnsJwtToken` |
| 4 | `AUTH-ACC-004` | **IdentityAccess**<br>_LoginRegularUseCase_ | **P0** | `unit` | Chặn đăng nhập khi sai mật khẩu hoặc tài khoản bị khóa | Không sinh JWT token cho tài khoản không hợp lệ | `LoginRegularUseCase_InvalidOrLocked_RejectsLogin` |
| 5 | `AUTH-ACC-005` | **IdentityAccess**<br>_ChangePasswordUseCase_ | **P0** | `unit` | Đổi mật khẩu: kiểm tra mật khẩu cũ chính xác và cập nhật hash mới | Không cho phép đổi nếu mật khẩu cũ không khớp | `ChangePasswordUseCase_ValidOldPassword_UpdatesHash` |
| 6 | `AUTH-ACC-006` | **IdentityAccess**<br>_GoogleLoginCallbackUseCase_ | **P1** | `unit` | Xử lý Google OAuth token tại biên: tạo mới user nếu chưa có hoặc đăng nhập | Không yêu cầu mật khẩu hệ thống cho user Google OAuth | `GoogleLoginCallbackUseCase_ValidPayload_AuthenticatesSuccessfully` |
| 7 | `RBAC-PERM-001` | **Admin**<br>_AssignRoleToUserUseCase_ | **P0** | `unit` | Admin phân quyền role cho tài khoản, ngăn chặn escalation trái phép | User thường không được tự gán role Admin | `AssignRoleToUserUseCase_AdminAssignsStaff_UpdatesSuccessfully` |
| 8 | `RBAC-PERM-002` | **TheaterManager**<br>_TheaterManagerMovieSchedulesController_ | **P0** | `integration` | Rà soát Cinema Tenancy: Quản lý rạp A không được sửa rạp B | Không làm rò rỉ dữ liệu hoặc thay đổi trạng thái của rạp khác | `MovieSchedules_CrossCinemaModification_ReturnsForbidden403` |
| 9 | `RBAC-PERM-003` | **Admin**<br>_GetRecentAuditLogsUseCase_ | **P1** | `integration` | Ghi nhận và truy vấn Audit Log khi Admin/Manager thực hiện thao tác nhạy cảm | Không ghi thiếu thông tin người thực hiện | `AuditLogs_AdminOperations_LoggedAndRetrievedAccurately` |
| 10 | `MOV-CAT-001` | **MovieManager**<br>_CreateMovieUseCase_ | **P1** | `unit` | Thêm phim mới với đầy đủ thông tin định dạng, poster, thời lượng | Không tạo phim với thời lượng <= 0 | `CreateMovieUseCase_ValidData_CreatesMovie` |
| 11 | `MOV-CAT-002` | **MovieManager**<br>_DeleteMovieUseCase_ | **P0** | `integration` | Chặn xóa phim đang có lịch chiếu hoạt động hoặc có vé đã đặt | Không xóa cascade làm mất lịch chiếu hoặc vé đã bán | `DeleteMovieUseCase_MovieInUse_RejectsDeletion` |
| 12 | `AUD-LAYOUT-001` | **FacilitiesManager**<br>_CreateAuditoriumUseCase_ | **P1** | `unit` | Tạo phòng chiếu và sinh ma trận ghế (hàng, cột, loại ghế, lối đi) | Không cho phép trùng tọa độ hàng/cột giữa hai ghế | `CreateAuditoriumUseCase_ValidLayout_GeneratesSeats` |
| 13 | `AUD-LAYOUT-002` | **FacilitiesManager**<br>_UpdateAuditoriumUseCase_ | **P0** | `integration` | Chặn sửa sơ đồ ghế phòng chiếu khi đã có vé được bán | Không làm sai lệch vị trí ghế của các vé đã bán trước đó | `UpdateAuditoriumUseCase_HasBookings_RejectsLayoutUpdate` |
| 14 | `SCHED-SHOW-001` | **TheaterManager**<br>_CreateMovieScheduleUseCase_ | **P1** | `unit` | Tạo lịch chiếu hợp lệ: kiểm tra thời gian bắt đầu, thời lượng phim và thời gian dọn dẹp | — | `CreateMovieScheduleUseCase_ValidTimes_CreatesSchedule` |
| 15 | `SCHED-SHOW-002` | **TheaterManager**<br>_CreateMovieScheduleUseCase_ | **P0** | `integration` | Chặn tạo lịch chiếu bị trùng khung giờ trong cùng một phòng chiếu | Không cho phép 2 suất chiếu cùng phát song song trong 1 phòng | `CreateMovieScheduleUseCase_OverlappingShowtime_Rejects` |
| 16 | `SEAT-POL-001` | **Booking**<br>_BookingSeatSelectionPolicy_ | **P0** | `unit` | Kiểm tra chính sách chọn ghế: không để lại ghế trống đơn lẻ (orphan seat) | Không chấp nhận danh sách ghế vi phạm orphan seat rule | `SeatSelectionPolicy_OrphanSingleSeat_ReturnsInvalid` |
| 17 | `SEAT-POL-002` | **Booking**<br>_BookingSeatSelectionPolicy_ | **P0** | `unit` | Giới hạn số lượng ghế đặt: tối thiểu 1 ghế, tối đa 10 ghế mỗi lượt đặt | Không cho phép tạo booking 0 vé hoặc vượt quá giới hạn vé | `SeatSelectionPolicy_InvalidSeatCounts_Rejects` |
| 18 | `SEAT-LOCK-001` | **Booking**<br>_SeatLockManager_ | **P0** | `integration` | Khóa ghế thành công trong Redis với TTL 10 phút | Không cho phép người khác ghi đè lock | `SeatLockManager_LockSingleSeat_SetsRedisWithTTL` |
| 19 | `SEAT-LOCK-002` | **Booking**<br>_SeatLockManager_ | **P0** | `concurrency` | Tranh chấp giữ ghế đồng thời (Race Condition): Chỉ 1 client giữ thành công | Không bao giờ có 2 client cùng nhận trạng thái LockSuccess | `SeatLockManager_ConcurrentLockRequests_OnlyOneSucceeds` |
| 20 | `SEAT-LOCK-003` | **Booking**<br>_SeatLockManager_ | **P0** | `integration` | Rollback toàn bộ khi giữ nhiều ghế nhưng có 1 ghế bị người khác giữ trước | User Y không được chiếm giữ dở dang seat-10 khi thất bại | `SeatLockManager_BatchLockPartialFailure_RollsBackAllAcquiredLocks` |
| 21 | `SEAT-LOCK-004` | **Booking**<br>_SeatLockManager_ | **P0** | `integration` | Chặn mở khóa ghế của người khác (Sai owner không được unlock) | Không cho phép can thiệp vào khóa của người dùng khác | `SeatLockManager_UnlockByWrongUser_FailsToUnlock` |
| 22 | `BOOK-FLOW-001` | **Booking**<br>_CreateBookingUseCase_ | **P0** | `integration` | Tạo đơn đặt vé hợp lệ: tính giá chính xác từ server, sinh đơn Pending và URL thanh toán | Không tin tưởng tổng tiền gửi từ client<br>Không kích hoạt vé khi chưa trả tiền | `CreateBookingUseCase_ValidData_CreatesPendingOrderWithAccuratePrice` |
| 23 | `BOOK-FLOW-002` | **Booking**<br>_CreateBookingUseCase_ | **P0** | `concurrency` | Hai request đồng thời tạo đơn cùng 1 ghế: ngăn chặn 2 vé trùng | Không bao giờ xuất hiện double booking | `CreateBooking_ConcurrentCreationSameSeat_OneSucceedsOneFails` |
| 24 | `BOOK-FLOW-003` | **Booking**<br>_GetTicketDataUseCase_ | **P0** | `unit` | Truy vấn vé: chỉ chủ sở hữu hoặc nhân viên rạp mới được xem chi tiết vé | Không làm rò rỉ thông tin cá nhân và vé của khách hàng khác | `GetTicketDataUseCase_OtherUser_ReturnsForbidden` |
| 25 | `PRICE-CALC-001` | **Admin**<br>_CalculatePricingPromotionUseCase_ | **P0** | `unit` | Tính toán phụ thu định dạng (3D/IMAX), loại ghế (VIP/Couple) và giảm giá khuyến mãi | Không áp dụng sai tỷ lệ làm tròn giá vé | `CalculatePricingPromotionUseCase_FormatAndSeatSurcharges_CalculatesAccurately` |
| 26 | `VOUCH-APPLY-001` | **Admin**<br>_RedeemVoucherUseCase_ | **P0** | `unit` | Áp dụng voucher hợp lệ: kiểm tra hạn dùng, hạng thành viên, giá trị tối thiểu | Không giảm giá vượt quá giá trị tối đa được thiết lập | `RedeemVoucherUseCase_ValidConditions_AppliesDiscountAccurately` |
| 27 | `VOUCH-CONCUR-001` | **Admin**<br>_RedeemVoucherUseCase_ | **P0** | `concurrency` | Tranh chấp voucher còn 1 lượt dùng duy nhất (Race Condition) | Voucher không được vượt quá số lượt sử dụng tối đa | `RedeemVoucher_ConcurrentUsageLastRemaining_OnlyOneSucceeds` |
| 28 | `PAY-VNPAY-001` | **Booking**<br>_ProcessVnPayCallbackUseCase_ | **P0** | `integration` | Xử lý callback VNPay thành công: Xác minh HMAC-SHA512, chuyển Order sang Booked, kích hoạt vé | Không hủy đơn khi callback thành công | `ProcessVnPayCallback_ValidSignatureAndSuccessCode_CompletesOrder` |
| 29 | `PAY-VNPAY-002` | **Booking**<br>_ProcessVnPayCallbackUseCase_ | **P0** | `integration` | Chặn và từ chối callback có chữ ký sai (Invalid Checksum/Tampered URL) | Không bao giờ hoàn tất đơn hàng khi chữ ký không khớp | `ProcessVnPayCallback_InvalidSignature_RejectsAndFailsBooking` |
| 30 | `PAY-VNPAY-003` | **Booking**<br>_ProcessVnPayCallbackUseCase_ | **P0** | `concurrency` | Idempotency: Nhận 2 callback thành công đồng thời cho cùng 1 đơn hàng | Không cộng điểm 2 lần<br>Không trừ kho 2 lần | `ProcessVnPayCallback_DuplicateConcurrentCallbacks_IsIdempotent` |
| 31 | `JOB-EXP-001` | **BackgroundJobs**<br>_PendingOrderCancellationJob_ | **P0** | `integration` | Job tự động quét và hủy đơn hàng Pending quá 15 phút, giải phóng ghế và kho | Không hủy đơn đã thanh toán (Booked)<br>Không hủy đơn mới tạo dưới 15 phút | `PendingOrderCancellationJob_ExpiredOrders_CancelsAndReleasesResources` |
| 32 | `JOB-BANNER-001` | **BackgroundJobs**<br>_AutoGenerateBannersJob_ | **P1** | `integration` | Tự động sinh banner nổi bật cho rạp chiếu dựa trên phim đang hot | Không sinh banner trùng lặp quá mức | `AutoGenerateBannersJob_ExecutesSuccessfully` |
| 33 | `JOB-SYNC-001` | **BackgroundJobs**<br>_MovieStatusSyncBackgroundService_ | **P1** | `integration` | Đồng bộ trạng thái phim: Chuyển phim từ Coming Soon sang Now Showing khi đến ngày | — | `MovieStatusSync_ReleaseDateReached_UpdatesStatus` |
| 34 | `GRP-ROOM-001` | **SocialBooking**<br>_CreateGroupBookingRoomUseCase_ | **P1** | `unit` | Tạo phòng đặt vé nhóm (2-8 người), sinh mã phòng duy nhất | — | `CreateGroupBookingRoom_ValidShowtime_CreatesRoomWithCode` |
| 35 | `GRP-ROOM-002` | **SocialBooking**<br>_JoinGroupBookingRoomUseCase_ | **P1** | `unit` | Thành viên tham gia phòng: kiểm tra mã phòng, giới hạn tối đa 8 người | Không cho phép vượt quá sức chứa tối đa của nhóm | `JoinGroupBookingRoom_MaxCapacityReached_RejectsNewMember` |
| 36 | `GRP-VOTE-001` | **SocialBooking**<br>_VotePaymentMethodUseCase_ | **P1** | `unit` | Bỏ phiếu phương thức thanh toán nhóm và giải quyết hòa phiếu bằng quyền của Host | — | `VotePaymentMethod_TieVotes_HostHasTiebreakerDecisiveVote` |
| 37 | `CONC-INV-001` | **Concessions**<br>_ReserveStockUseCase_ | **P0** | `concurrency` | Quản lý tồn kho: Tranh chấp mua phần tồn kho cuối cùng (Race Condition) | Tồn kho không bao giờ bị âm (< 0) | `ConcessionInventory_ConcurrentReservationLastItem_PreventsNegativeStock` |
| 38 | `CONC-INV-002` | **Concessions**<br>_CommitStockUseCase_ | **P0** | `integration` | Xác nhận trừ kho sau khi thanh toán đơn hàng thành công | — | `CommitStockUseCase_ValidOrder_FinalizesInventoryDeduction` |
| 39 | `STAFF-SHIFT-001` | **Staff**<br>_RegisterShiftUseCase_ | **P1** | `unit` | Nhân viên đăng ký ca làm việc: kiểm tra không trùng ca, rạp hợp lệ | Không cho phép đăng ký 2 ca trùng giờ nhau | `RegisterShiftUseCase_ValidShift_RegistersPending` |
| 40 | `STAFF-CLOCK-001` | **Staff**<br>_ClockInUseCase_ | **P1** | `unit` | Chấm công vào ca: kiểm tra dữ liệu nhận diện khuôn mặt ở biên API | Không cho phép clock-in 2 lần trong cùng một ca | `ClockInUseCase_ValidFaceData_RecordsClockInTime` |
| 41 | `CLEAN-TASK-001` | **Cleaning**<br>_TheaterManagerCleaningController_ | **P1** | `unit` | Quản lý giao việc dọn dẹp phòng chiếu sau khi kết thúc suất chiếu | Không thể hoàn thành nếu chưa chuyển sang InProgress | `CleaningTask_LifecycleTransitions_HandledCorrectly` |
| 42 | `ENG-COMM-001` | **Customer**<br>_CreateMovieCommentUseCase_ | **P2** | `integration` | Bình luận phim: kiểm tra quyền của người dùng và lọc nội dung qua AI moderation | — | `CreateMovieComment_AppropriateContent_CreatesSuccessfully` |
| 43 | `AI-REST-001` | **AiService**<br>_HealthRouter_ | **P1** | `unit` | Kiểm tra endpoint /health trả về trạng thái healthy của FastAPI | — | `test_health_endpoint` |
| 44 | `AI-REC-001` | **AiService**<br>_RecommendationsRouter_ | **P1** | `unit` | Đề xuất phim cá nhân hóa dựa trên vector embedding Qdrant (Mock LLM) | — | `test_recommend_request_valid` |
| 45 | `AI-LIVE-001` | **AiService**<br>_ChatRouter_ | **P1** | `live_ai` | Live AI smoke test với API key thật: gọi tool và trích xuất tham số đặt vé | Không vượt quá 20 API calls trong 1 lần chạy | `test_live_ai_smoke_booking_intent` |
| 46 | `API-GEN-001` | **Common**<br>_RateLimiterMiddleware_ | **P0** | `integration` | Rate limit: Chặn request khi vượt quá hạn mức cấu hình (HTTP 429 Too Many Requests) | Không cho phép spam làm tê liệt hệ thống | `RateLimiting_ExceedsQuota_Returns429TooManyRequests` |
| 47 | `API-GEN-002` | **Common**<br>_ErrorHandlingMiddleware_ | **P1** | `unit` | Middleware xử lý lỗi tập trung: Định dạng JSON trả về chuẩn RFC 7807, không lộ stack trace bí mật | Không rò rỉ stack trace bí mật hoặc chuỗi kết nối ra ngoài | `ErrorMiddleware_UnhandledException_ReturnsStandardProblemDetails` |
