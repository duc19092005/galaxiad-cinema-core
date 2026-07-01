# Quản trị hệ thống — Admin

> Module quản trị toàn bộ hệ thống Galaxiad Cinema. Đây là module lớn nhất với 8+ phân hệ.

## Tổng quan

Admin Panel cung cấp giao diện tab-based cho phép Admin quản lý tất cả khía cạnh của hệ thống:
1. **User Management** — Quản lý người dùng, phân quyền RBAC
2. **Dashboard** — Thống kê doanh thu, vé, phim
3. **Audit Log** — Nhật ký kiểm tra
4. **Voucher Management** — Quản lý voucher
5. **Pricing & Promotions** — Giá vé & khuyến mãi
6. **Transfer Rights** — Chuyển quyền quản lý
7. **Shift Cancellation** — Phê duyệt hủy ca
8. **Background Jobs** — Công việc nền (Hangfire dashboard)

## Frontend

### Routes
| Route | Component | Mô tả |
|---|---|---|
| `/admin` | `AdminPage` | Container chính với tab navigation |
| `/admin/users` | `AdminUsersTab` | Quản lý người dùng |
| `/admin/dashboard` | `AdminDashboardTab` | Thống kê & dashboard |
| `/admin/audit` | `AdminAuditTab` | Xem audit log |
| `/admin/vouchers` | `AdminVoucherTab` | Quản lý voucher |
| `/admin/promotions` | `AdminPromotionTab` | Quản lý giá & khuyến mãi |
| `/admin/transfer` | `AdminTransferTab` | Chuyển quyền quản lý |
| `/admin/shift-cancel` | `AdminShiftCancelTab` | Phê duyệt hủy ca |
| `/admin/jobs` | `AdminJobsTab` | Dashboard Hangfire |

### Components chính
- **`UserTable`**: Bảng danh sách người dùng với phân trang và filter
- **`UserFormModal`**: Modal thêm/sửa người dùng
- **`RoleAssignmentModal`**: Modal gán/quản lý role và permissions
- **`RolePermissionMatrix`**: Bảng ma trận quyền (Role × Permission)
- **`PermissionToggle`**: Component toggle quyền cho từng role
- **`RevenueChart`**, **`TicketChart`**: Biểu đồ doanh thu và vé
- **`TopMoviesTable`**: Bảng top phim theo doanh thu
- **`AuditLogTable`**: Bảng audit log với filter thời gian, user, action
- **`AuditLogDetail`**: Chi tiết audit log entry
- **`VoucherTable`**: Bảng danh sách voucher
- **`VoucherFormModal`**: Modal tạo/sửa voucher
- **`PromotionFormModal`**: Modal tạo/sửa promotion rule
- **`PromotionScopeEditor`**: Editor phạm vi áp dụng promotion
- **`PricingTable`**: Bảng giá vé theo format
- **`TransferRightsModal`**: Modal chuyển quyền
- **`ShiftCancelTable`**: Danh sách yêu cầu hủy ca chờ duyệt

## Backend

### API Endpoints

#### User Management
| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `api/v1/AdminManageUsers/users` | Danh sách users (phân trang) |
| GET | `api/v1/AdminManageUsers/users/{id}` | Chi tiết user |
| POST | `api/v1/AdminManageUsers/users` | Thêm user mới |
| PUT | `api/v1/AdminManageUsers/users/{id}` | Cập nhật user |
| PATCH | `api/v1/AdminManageUsers/users/{id}/status` | Khóa/Mở khóa user |
| GET | `api/v1/AdminManageUsers/roles` | Danh sách roles |
| GET | `api/v1/AdminManageUsers/roles/{id}/permissions` | Quyền của role |
| PUT | `api/v1/AdminManageUsers/roles/{id}/permissions` | Cập nhật quyền cho role |
| GET | `api/v1/AdminManageUsers/permissions` | Danh sách permissions |

#### Dashboard
| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `api/v1/admin/dashboard/revenue` | Thống kê doanh thu |
| GET | `api/v1/admin/dashboard/tickets` | Thống kê vé bán ra |
| GET | `api/v1/admin/dashboard/top-movies` | Top phim theo doanh thu |

#### Audit Log
| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `api/v1/admin/audit-logs` | Danh sách audit log (phân trang + filter) |
| GET | `api/v1/admin/audit-logs/{id}` | Chi tiết audit log |

#### Voucher
| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `api/v1/admin/vouchers` | Danh sách voucher |
| POST | `api/v1/admin/vouchers` | Tạo voucher |
| PUT | `api/v1/admin/vouchers/{id}` | Cập nhật voucher |
| DELETE | `api/v1/admin/vouchers/{id}` | Xóa voucher |

#### Pricing & Promotions
| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `api/v1/admin/pricing` | Bảng giá hiện tại |
| PUT | `api/v1/admin/pricing` | Cập nhật bảng giá |
| GET | `api/v1/admin/promotions` | Danh sách promotion rules |
| POST | `api/v1/admin/promotions` | Tạo promotion rule |
| PUT | `api/v1/admin/promotions/{id}` | Cập nhật promotion rule |
| DELETE | `api/v1/admin/promotions/{id}` | Xóa promotion rule |

#### Transfer Rights
| Method | Endpoint | Chức năng |
|---|---|---|
| POST | `api/v1/admin/transfer-rights` | Chuyển quyền quản lý |
| GET | `api/v1/admin/transfer-rights/history` | Lịch sử chuyển quyền |

#### Shift Cancellation
| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `api/Admin/Shifts/pending-cancellations` | Danh sách yêu cầu hủy |
| POST | `api/Admin/Shifts/approve-cancellation` | Phê duyệt hủy ca |
| POST | `api/Admin/Shifts/reject-cancellation` | Từ chối hủy ca |

### Use Cases
| Use Case | Mô tả |
|---|---|
| `GetUsersUseCase` | Lấy danh sách users với phân trang và filter |
| `CreateUserUseCase` | Tạo user mới |
| `UpdateUserUseCase` | Cập nhật thông tin user |
| `ToggleUserStatusUseCase` | Khóa/Mở khóa user |
| `GetRolesUseCase` | Lấy danh sách roles |
| `GetRolePermissionsUseCase` | Lấy permissions của role |
| `UpdateRolePermissionsUseCase` | Cập nhật permissions cho role |
| `GetDashboardRevenueUseCase` | Thống kê doanh thu |
| `GetDashboardTicketsUseCase` | Thống kê vé |
| `GetTopMoviesUseCase` | Top phim |
| `GetAuditLogsUseCase` | Lấy audit log |
| `GetAuditLogDetailUseCase` | Chi tiết audit log |
| `CreateVoucherUseCase` | Tạo voucher |
| `UpdateVoucherUseCase` | Cập nhật voucher |
| `DeleteVoucherUseCase` | Xóa voucher |
| `GetPricingUseCase` | Lấy bảng giá |
| `UpdatePricingUseCase` | Cập nhật giá |
| `CreatePromotionRuleUseCase` | Tạo promotion rule |
| `UpdatePromotionRuleUseCase` | Cập nhật promotion rule |
| `DeletePromotionRuleUseCase` | Xóa promotion rule |
| `TransferRightsUseCase` | Chuyển quyền quản lý |
| `GetPendingCancellationsUseCase` | Yêu cầu hủy ca chờ duyệt |
| `ApproveCancellationUseCase` | Phê duyệt hủy ca |
| `RejectCancellationUseCase` | Từ chối hủy ca |

### Domain Entities
| Entity | Mô tả |
|---|---|
| `User` | Người dùng |
| `Role` | Vai trò |
| `Permission` | Quyền hạn cụ thể |
| `RolePermission` | Liên kết Role-Permission |
| `AuditLog` | Nhật ký kiểm tra (Actor, Action, Entity, Changes, Timestamp) |
| `Voucher` | Mã giảm giá (Name, Discount, PointsCost, Quantity, ValidFrom, ValidTo) |
| `PricingRule` | Quy tắc giá (Format, BasePrice, Discount, Surcharge) |
| `PromotionRule` | Quy tắc khuyến mãi (Type, Value, Scope, Priority, DateRange) |
| `TransferRightRecord` | Lịch sử chuyển quyền |
| `ShiftCancellationRequest` | Yêu cầu hủy ca |

## Ghi chú — Dead/Broken Code

> [!WARNING]
> **Movie Delete** — Frontend gọi `DELETE /api/movieManager/movies/{id}` nhưng backend **chưa có endpoint** tương ứng. Use case `DeleteMovieUseCase` có trong DI nhưng chưa được wire vào controller.

> [!NOTE]
> **Delete Cinema/Auditorium** — `DeleteCinemaUseCase` và `DeleteAuditoriumUseCase` đã được đăng ký trong DI nhưng **chưa có controller endpoint** để gọi. Các chức năng delete này chưa implemented đầy đủ.
