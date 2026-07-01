# Administration Panel — Admin

> System administration module. The largest module with 8+ subsystems.

## Overview

Tab-based admin panel covering:
1. **User Management** — User CRUD, RBAC permissions matrix
2. **Dashboard** — Revenue, ticket, and movie statistics
3. **Audit Log** — System audit trail
4. **Voucher Management** — Discount voucher CRUD
5. **Pricing & Promotions** — Ticket pricing and promotion rules
6. **Transfer Rights** — Transfer management rights
7. **Shift Cancellation** — Approve shift deletion requests
8. **Background Jobs** — Hangfire dashboard

## Frontend

### Routes
| Route | Component | Description |
|---|---|---|
| `/admin` | `AdminPage` | Main tab-based admin container |
| `/admin/users` | `AdminUsersTab` | User management |
| `/admin/dashboard` | `AdminDashboardTab` | Statistics dashboard |
| `/admin/audit` | `AdminAuditTab` | Audit log viewer |
| `/admin/vouchers` | `AdminVoucherTab` | Voucher management |
| `/admin/promotions` | `AdminPromotionTab` | Pricing & promotions |
| `/admin/transfer` | `AdminTransferTab` | Rights transfer |
| `/admin/shift-cancel` | `AdminShiftCancelTab` | Shift cancellation approval |
| `/admin/jobs` | `AdminJobsTab` | Hangfire dashboard |

### Key Components
- **`UserTable`**: Paginated user list with filters
- **`UserFormModal`**: Add/edit user modal
- **`RoleAssignmentModal`**: Role & permission management
- **`RolePermissionMatrix`**: Role × Permission grid
- **`PermissionToggle`**: Individual permission toggle
- **`RevenueChart`**, **`TicketChart`**: Revenue and ticket charts
- **`TopMoviesTable`**: Top movies by revenue
- **`AuditLogTable`**: Audit log with time/user/action filters
- **`AuditLogDetail`**: Audit log entry detail
- **`VoucherTable`**: Voucher list
- **`VoucherFormModal`**: Create/edit voucher modal
- **`PromotionFormModal`**: Create/edit promotion rule modal
- **`PromotionScopeEditor`**: Promotion scope editor
- **`PricingTable`**: Format-based pricing table
- **`TransferRightsModal`**: Rights transfer modal
- **`ShiftCancelTable`**: Pending cancellation requests

## Backend

### API Endpoints

#### User Management
| Method | Endpoint | Description |
|---|---|---|
| GET | `api/v1/AdminManageUsers/users` | Paginated user list |
| GET | `api/v1/AdminManageUsers/users/{id}` | User detail |
| POST | `api/v1/AdminManageUsers/users` | Create user |
| PUT | `api/v1/AdminManageUsers/users/{id}` | Update user |
| PATCH | `api/v1/AdminManageUsers/users/{id}/status` | Lock/Unlock user |
| GET | `api/v1/AdminManageUsers/roles` | Role list |
| GET | `api/v1/AdminManageUsers/roles/{id}/permissions` | Role permissions |
| PUT | `api/v1/AdminManageUsers/roles/{id}/permissions` | Update role permissions |
| GET | `api/v1/AdminManageUsers/permissions` | All permissions |

#### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `api/v1/admin/dashboard/revenue` | Revenue statistics |
| GET | `api/v1/admin/dashboard/tickets` | Ticket sales stats |
| GET | `api/v1/admin/dashboard/top-movies` | Top movies by revenue |

#### Audit Log
| Method | Endpoint | Description |
|---|---|---|
| GET | `api/v1/admin/audit-logs` | Paginated audit logs (filtered) |
| GET | `api/v1/admin/audit-logs/{id}` | Audit log detail |

#### Voucher
| Method | Endpoint | Description |
|---|---|---|
| GET | `api/v1/admin/vouchers` | Voucher list |
| POST | `api/v1/admin/vouchers` | Create voucher |
| PUT | `api/v1/admin/vouchers/{id}` | Update voucher |
| DELETE | `api/v1/admin/vouchers/{id}` | Delete voucher |

#### Pricing & Promotions
| Method | Endpoint | Description |
|---|---|---|
| GET | `api/v1/admin/pricing` | Current pricing table |
| PUT | `api/v1/admin/pricing` | Update pricing |
| GET | `api/v1/admin/promotions` | Promotion rules list |
| POST | `api/v1/admin/promotions` | Create promotion rule |
| PUT | `api/v1/admin/promotions/{id}` | Update promotion rule |
| DELETE | `api/v1/admin/promotions/{id}` | Delete promotion rule |

#### Transfer Rights
| Method | Endpoint | Description |
|---|---|---|
| POST | `api/v1/admin/transfer-rights` | Transfer management rights |
| GET | `api/v1/admin/transfer-rights/history` | Transfer history |

#### Shift Cancellation
| Method | Endpoint | Description |
|---|---|---|
| GET | `api/Admin/Shifts/pending-cancellations` | Pending requests |
| POST | `api/Admin/Shifts/approve-cancellation` | Approve cancellation |
| POST | `api/Admin/Shifts/reject-cancellation` | Reject cancellation |

### Use Cases
| Use Case | Description |
|---|---|
| `GetUsersUseCase` | Paginated user list with filters |
| `CreateUserUseCase` | Create new user |
| `UpdateUserUseCase` | Update user info |
| `ToggleUserStatusUseCase` | Lock/Unlock user |
| `GetRolesUseCase` | List all roles |
| `GetRolePermissionsUseCase` | Get role permissions |
| `UpdateRolePermissionsUseCase` | Update role permissions |
| `GetDashboardRevenueUseCase` | Revenue statistics |
| `GetDashboardTicketsUseCase` | Ticket statistics |
| `GetTopMoviesUseCase` | Top movies |
| `GetAuditLogsUseCase` | Audit log list |
| `GetAuditLogDetailUseCase` | Audit log detail |
| `CreateVoucherUseCase` | Create voucher |
| `UpdateVoucherUseCase` | Update voucher |
| `DeleteVoucherUseCase` | Delete voucher |
| `GetPricingUseCase` | Current pricing |
| `UpdatePricingUseCase` | Update pricing table |
| `CreatePromotionRuleUseCase` | Create promotion rule |
| `UpdatePromotionRuleUseCase` | Update promotion rule |
| `DeletePromotionRuleUseCase` | Delete promotion rule |
| `TransferRightsUseCase` | Transfer management rights |
| `GetPendingCancellationsUseCase` | Pending shift cancellations |
| `ApproveCancellationUseCase` | Approve shift cancellation |
| `RejectCancellationUseCase` | Reject shift cancellation |

### Notes — Dead/Broken Code

> [!WARNING]
> **Movie Delete** — Frontend calls `DELETE /api/movieManager/movies/{id}` but backend has **no endpoint** wired. `DeleteMovieUseCase` exists in DI but not connected to a controller.

> [!NOTE]
> **Delete Cinema/Auditorium** — `DeleteCinemaUseCase` and `DeleteAuditoriumUseCase` are DI-registered but have **no controller endpoints** — delete functionality not fully implemented.
