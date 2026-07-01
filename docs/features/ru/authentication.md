# Аутентификация — Authentication

> Модуль аутентификации и управления идентификацией пользователей.

## Обзор

Поддерживает два метода аутентификации:
1. **Регистрация/Вход по email и паролю**
2. **Google OAuth 2.0** — Быстрый вход через Google

После первого входа пользователь **выбирает роль** (Customer/Staff). JWT токены хранятся в HTTP-only cookie.

## Frontend

### Routes
| Маршрут | Компонент | Описание |
|---|---|---|
| `/register` | `RegisterPage` | Форма регистрации |
| `/login` | `LoginPage` | Форма входа |
| `/auth/google-callback` | `GoogleCallbackPage` | Обработчик Google OAuth |
| `/role-selection` | `RoleSelectionPage` | Выбор роли |

### Ключевые компоненты
- **`LoginForm`**: Форма входа email/пароль
- **`RegisterForm`**: Форма регистрации
- **`GoogleCallbackHandler`**: Обработка редиректа Google
- **`RoleSelectionForm`**: Выбор доступных ролей
- **`ProfileForm`**: Просмотр и обновление профиля
- **`ChangePasswordForm`**: Смена пароля

## Backend

### API Endpoints
| Метод | Endpoint | Описание |
|---|---|---|
| POST | `api/v1/IdentityAccess/regular-register` | Регистрация |
| POST | `api/v1/IdentityAccess/regular-login` | Вход |
| POST | `api/v1/IdentityAccess/google-login` | Инициализация Google входа |
| GET | `api/v1/IdentityAccess/google-callback-web` | Google OAuth callback |
| POST | `api/v1/IdentityAccess/Logout` | Выход |
| GET | `api/v1/IdentityAccess/get-profile` | Получить профиль |
| POST | `api/v1/IdentityAccess/change-password` | Сменить пароль |
| PUT | `api/v1/IdentityAccess/update-profile` | Обновить профиль |

### Use Cases
| Use Case | Вход | Выход |
|---|---|---|
| `RegisterRegularUseCase` | Email, пароль, имя, дата рождения | UserId + JWT |
| `LoginRegularUseCase` | Email, пароль | JWT cookie |
| `GoogleLoginInitUseCase` | — | URL Google OAuth |
| `GoogleLoginCallbackUseCase` | Код авторизации | JWT токен |
| `ChangePasswordUseCase` | Старый и новый пароль | Успех/Ошибка |
| `GetProfileUseCase` | UserId | Профиль DTO |
| `UpdateUserProfileUseCase` | Данные профиля | Обновлённый профиль |

### Domain Entities
| Сущность | Описание |
|---|---|
| `User` | Аккаунт пользователя (Email, PasswordHash, Name, DOB, Phone) |
| `Role` | Роль (Customer, Cashier, MovieManager, TheaterManager, Admin) |
| `UserRole` | Связь User-Role (N-N) |
| `RolePermission` | Разрешения для роли |

### Enums
| Enum | Значения |
|---|---|
| `RoleType` | Customer, Cashier, MovieManager, TheaterManager, FacilitiesManager, Admin |
| `UserStatus` | Active, Locked |

## Описание потока данных

### Регистрация
```
User → RegisterForm → POST regular-register → Backend проверка → Хэш пароля →
Сохранение User → Генерация JWT → Установка cookie → Редирект на role-selection
```

### Вход через Google
```
User → Кнопка Google → GET google-login → Редирект на Google →
Аутентификация → Редирект на /auth/google-callback →
Backend получает код → Запрос к Google API → Создание/Обновление User →
Генерация JWT → Установка cookie → Редирект на /
```
