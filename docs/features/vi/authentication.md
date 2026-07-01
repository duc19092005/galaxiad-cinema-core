# Đăng ký / Đăng nhập — Authentication

> Module xác thực và quản lý danh tính người dùng.

## Tổng quan

Hệ thống hỗ trợ hai phương thức xác thực:
1. **Đăng ký/Đăng nhập bằng email & mật khẩu** — đăng ký tài khoản mới hoặc đăng nhập với thông tin đã có.
2. **Google OAuth 2.0** — đăng nhập nhanh qua tài khoản Google.

Sau lần đăng nhập đầu tiên, người dùng được yêu cầu **chọn vai trò** (Customer/Staff). Token JWT được lưu trong cookie HTTP-only để bảo vệ phiên đăng nhập.

## Frontend

### Routes
| Route | Component | Mô tả |
|---|---|---|
| `/register` | `RegisterPage` | Form đăng ký tài khoản mới |
| `/login` | `LoginPage` | Form đăng nhập |
| `/auth/google-callback` | `GoogleCallbackPage` | Xử lý callback từ Google OAuth |
| `/role-selection` | `RoleSelectionPage` | Chọn vai trò sau lần đăng nhập đầu tiên |

### Components chính
- **`LoginForm`**: Form đăng nhập email/password, import từ thư viện UI
- **`RegisterForm`**: Form đăng ký với các trường: email, password, confirm password, tên, ngày sinh, số điện thoại
- **`GoogleCallbackHandler`**: Xử lý redirect từ Google, lưu token vào cookie
- **`RoleSelectionForm`**: Hiển thị các role khả dụng cho người dùng chọn
- **`ProfileForm`**: Xem và cập nhật thông tin cá nhân
- **`ChangePasswordForm`**: Đổi mật khẩu

### i18n Keys
- `auth.login.title`, `auth.login.email`, `auth.login.password`
- `auth.register.title`, `auth.register.confirmPassword`
- `auth.social.google`, `auth.roleSelection.title`
- `auth.profile.title`, `auth.changePassword.title`

## Backend

### API Endpoints
| Method | Endpoint | Chức năng |
|---|---|---|
| POST | `api/v1/IdentityAccess/regular-register` | Đăng ký tài khoản mới |
| POST | `api/v1/IdentityAccess/regular-login` | Đăng nhập bằng email/password |
| POST | `api/v1/IdentityAccess/google-login` | Khởi tạo đăng nhập Google |
| GET | `api/v1/IdentityAccess/google-callback-web` | Callback từ Google OAuth (web) |
| POST | `api/v1/IdentityAccess/Logout` | Đăng xuất |
| GET | `api/v1/IdentityAccess/get-profile` | Lấy thông tin profile |
| POST | `api/v1/IdentityAccess/change-password` | Đổi mật khẩu |
| PUT | `api/v1/IdentityAccess/update-profile` | Cập nhật thông tin cá nhân |
| POST | `api/v1/IdentityAccess/google-login-mobile` | Google OAuth cho mobile (dead endpoint) |

### Use Cases
| Use Case | Input | Output |
|---|---|---|
| `RegisterRegularUseCase` | Email, password, name, DOB, phone | UserId + JWT token |
| `LoginRegularUseCase` | Email, password | JWT token in cookie |
| `GoogleLoginInitUseCase` | — | Google OAuth URL |
| `GoogleLoginCallbackUseCase` | Authorization code | JWT token |
| `ChangePasswordUseCase` | Old password, new password | Success/Failure |
| `GetProfileUseCase` | UserId (from token) | User profile DTO |
| `UpdateUserProfileUseCase` | Profile update data | Updated profile |

### Domain Entities
| Entity | Mô tả |
|---|---|
| `User` | Tài khoản người dùng (Email, PasswordHash, Name, DOB, Phone) |
| `Role` | Vai trò (Customer, Cashier, MovieManager, TheaterManager, FacilitiesManager, Admin) |
| `UserRole` | Liên kết User-Role (N-N) |
| `RolePermission` | Quyền của từng role |
| `RefreshToken` | Token làm mới phiên đăng nhập |

### Enums
| Enum | Values |
|---|---|
| `RoleType` | Customer, Cashier, MovieManager, TheaterManager, FacilitiesManager, Admin |
| `UserStatus` | Active, Locked |

## Luồng xử lý

### Đăng ký
```
User → RegisterForm → POST regular-register → Backend validate → Hash password → 
Save User → Generate JWT → Set cookie → Redirect to role-selection
```

### Đăng nhập Google
```
User → Click Google Login → GET google-login → Redirect to Google →
User xác thực trên Google → Redirect về /auth/google-callback →
Backend nhận code → Gọi Google API → Tạo/Cập nhật User →
Generate JWT → Set cookie → Redirect to / or role-selection
```

### Chọn vai trò
```
User → RoleSelectionPage → Chọn role → PUT update-profile (role) → 
Cập nhật UserRole → Redirect đến dashboard tương ứng
```

## Ghi chú quan trọng

> [!NOTE]
> - Cookie JWT có flag `HttpOnly`, `Secure`, `SameSite=Strict`
> - Token hết hạn sau 24h (configurable)
> - `GoogleLoginMobile` có code giống hệt `GoogleLoginCallbackWeb` nhưng frontend không gọi — được coi là dead endpoint
