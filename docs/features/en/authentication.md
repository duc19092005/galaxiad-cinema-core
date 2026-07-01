# Authentication & Identity Access

> User authentication and identity management module.

## Overview

Supports two authentication methods:
1. **Email & Password Registration/Login** — Standard account creation and login
2. **Google OAuth 2.0** — Quick login via Google account

After first login, users must **select a role** (Customer/Staff). JWT tokens are stored in HTTP-only cookies for secure session management.

## Frontend

### Routes
| Route | Component | Description |
|---|---|---|
| `/register` | `RegisterPage` | New account registration form |
| `/login` | `LoginPage` | Login form |
| `/auth/google-callback` | `GoogleCallbackPage` | Google OAuth callback handler |
| `/role-selection` | `RoleSelectionPage` | Role selection after first login |

### Key Components
- **`LoginForm`**: Email/password login form (UI library component)
- **`RegisterForm`**: Registration form (email, password, confirm password, name, DOB, phone)
- **`GoogleCallbackHandler`**: Handles Google redirect, saves JWT cookie
- **`RoleSelectionForm`**: Shows available roles for user selection
- **`ProfileForm`**: View and update personal information
- **`ChangePasswordForm`**: Change password form

### i18n Keys
- `auth.login.title`, `auth.login.email`, `auth.login.password`
- `auth.register.title`, `auth.register.confirmPassword`
- `auth.social.google`, `auth.roleSelection.title`
- `auth.profile.title`, `auth.changePassword.title`

## Backend

### API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | `api/v1/IdentityAccess/regular-register` | Register new account |
| POST | `api/v1/IdentityAccess/regular-login` | Login with email/password |
| POST | `api/v1/IdentityAccess/google-login` | Initiate Google login |
| GET | `api/v1/IdentityAccess/google-callback-web` | Google OAuth callback (web) |
| POST | `api/v1/IdentityAccess/Logout` | Logout |
| GET | `api/v1/IdentityAccess/get-profile` | Get user profile |
| POST | `api/v1/IdentityAccess/change-password` | Change password |
| PUT | `api/v1/IdentityAccess/update-profile` | Update profile |
| POST | `api/v1/IdentityAccess/google-login-mobile` | Google OAuth for mobile (dead endpoint) |

### Use Cases
| Use Case | Input | Output |
|---|---|---|
| `RegisterRegularUseCase` | Email, password, name, DOB, phone | UserId + JWT token |
| `LoginRegularUseCase` | Email, password | JWT cookie |
| `GoogleLoginInitUseCase` | — | Google OAuth URL |
| `GoogleLoginCallbackUseCase` | Authorization code | JWT token |
| `ChangePasswordUseCase` | Old password, new password | Success/Failure |
| `GetProfileUseCase` | UserId (from token) | User profile DTO |
| `UpdateUserProfileUseCase` | Profile update data | Updated profile |

### Domain Entities
| Entity | Description |
|---|---|
| `User` | User account (Email, PasswordHash, Name, DOB, Phone) |
| `Role` | Role (Customer, Cashier, MovieManager, TheaterManager, FacilitiesManager, Admin) |
| `UserRole` | User-Role mapping (N-N) |
| `RolePermission` | Permission per role |
| `RefreshToken` | Session refresh token |

### Enums
| Enum | Values |
|---|---|
| `RoleType` | Customer, Cashier, MovieManager, TheaterManager, FacilitiesManager, Admin |
| `UserStatus` | Active, Locked |

## Data Flow

### Registration
```
User → RegisterForm → POST regular-register → Backend validate → Hash password →
Save User → Generate JWT → Set cookie → Redirect to role-selection
```

### Google Login
```
User → Click Google Login → GET google-login → Redirect to Google →
User authenticates → Redirects to /auth/google-callback →
Backend receives code → Calls Google API → Creates/Updates User →
Generates JWT → Sets cookie → Redirects to / or role-selection
```

### Notes
> [!NOTE]
> - JWT cookie has `HttpOnly`, `Secure`, `SameSite=Strict` flags
> - Token expires after 24h (configurable)
> - `GoogleLoginMobile` is identical to `GoogleLoginCallbackWeb` but frontend never calls it — considered dead endpoint
