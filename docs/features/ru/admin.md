# Панель администратора — Admin

> Модуль администрирования системы. Самый большой модуль с 8+ подсистемами.

## Обзор

Панель администратора с вкладками:
1. **Управление пользователями** — CRUD, RBAC, матрица разрешений
2. **Дашборд** — Статистика доходов, билетов, фильмов
3. **Аудит-лог** — Журнал проверок системы
4. **Управление ваучерами** — CRUD скидочных ваучеров
5. **Цены и акции** — Правила ценообразования и акций
6. **Передача прав** — Передача прав управления
7. **Отмена смен** — Утверждение отмены смен
8. **Фоновые задачи** — Hangfire dashboard

## Frontend

### Routes
| Маршрут | Компонент | Описание |
|---|---|---|
| `/admin` | `AdminPage` | Контейнер с вкладками |
| `/admin/users` | `AdminUsersTab` | Управление пользователями |
| `/admin/dashboard` | `AdminDashboardTab` | Дашборд статистики |
| `/admin/audit` | `AdminAuditTab` | Просмотр аудит-логов |
| `/admin/vouchers` | `AdminVoucherTab` | Управление ваучерами |
| `/admin/promotions` | `AdminPromotionTab` | Цены и акции |
| `/admin/transfer` | `AdminTransferTab` | Передача прав |
| `/admin/shift-cancel` | `AdminShiftCancelTab` | Одобрение отмены смен |
| `/admin/jobs` | `AdminJobsTab` | Hangfire dashboard |

## Backend

### API Endpoints

#### Управление пользователями
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `api/v1/AdminManageUsers/users` | Список пользователей (пагинация) |
| GET | `api/v1/AdminManageUsers/users/{id}` | Детали пользователя |
| POST | `api/v1/AdminManageUsers/users` | Создать пользователя |
| PUT | `api/v1/AdminManageUsers/users/{id}` | Обновить пользователя |
| PATCH | `api/v1/AdminManageUsers/users/{id}/status` | Заблокировать/Разблокировать |
| GET | `api/v1/AdminManageUsers/roles` | Список ролей |
| GET | `api/v1/AdminManageUsers/roles/{id}/permissions` | Разрешения роли |
| PUT | `api/v1/AdminManageUsers/roles/{id}/permissions` | Обновить разрешения |

#### Дашборд
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `api/v1/admin/dashboard/revenue` | Статистика доходов |
| GET | `api/v1/admin/dashboard/tickets` | Статистика билетов |
| GET | `api/v1/admin/dashboard/top-movies` | Топ фильмов |

#### Аудит-лог
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `api/v1/admin/audit-logs` | Аудит-логи (пагинация, фильтры) |
| GET | `api/v1/admin/audit-logs/{id}` | Детали аудит-лога |

#### Ваучеры
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `api/v1/admin/vouchers` | Список ваучеров |
| POST | `api/v1/admin/vouchers` | Создать ваучер |
| PUT | `api/v1/admin/vouchers/{id}` | Обновить ваучер |
| DELETE | `api/v1/admin/vouchers/{id}` | Удалить ваучер |

#### Цены и акции
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `api/v1/admin/pricing` | Текущие цены |
| PUT | `api/v1/admin/pricing` | Обновить цены |
| GET | `api/v1/admin/promotions` | Правила акций |
| POST | `api/v1/admin/promotions` | Создать правило |
| PUT | `api/v1/admin/promotions/{id}` | Обновить правило |
| DELETE | `api/v1/admin/promotions/{id}` | Удалить правило |

#### Передача прав
| Метод | Endpoint | Описание |
|---|---|---|
| POST | `api/v1/admin/transfer-rights` | Передача прав управления |
| GET | `api/v1/admin/transfer-rights/history` | История передач |

#### Отмена смен
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `api/Admin/Shifts/pending-cancellations` | Запросы на отмену |
| POST | `api/Admin/Shifts/approve-cancellation` | Утвердить отмену |
| POST | `api/Admin/Shifts/reject-cancellation` | Отклонить отмену |

### Use Cases
- Управление пользователями: GetUsers, CreateUser, UpdateUser, ToggleUserStatus
- Роли: GetRoles, GetRolePermissions, UpdateRolePermissions
- Дашборд: GetDashboardRevenue, GetDashboardTickets, GetTopMovies
- Аудит: GetAuditLogs, GetAuditLogDetail
- Ваучеры: CreateVoucher, UpdateVoucher, DeleteVoucher
- Цены: GetPricing, UpdatePricing
- Акции: CreatePromotionRule, UpdatePromotionRule, DeletePromotionRule
- Передача прав: TransferRights
- Отмена смен: GetPendingCancellations, ApproveCancellation, RejectCancellation

### Примечания — Мёртвый/Сломанный код

> [!WARNING]
> **Удаление фильма** — Frontend вызывает `DELETE /api/movieManager/movies/{id}`, но бэкенд **не имеет endpoint**. `DeleteMovieUseCase` есть в DI, но не подключён к контроллеру.

> [!NOTE]
> **Удаление кинотеатра/зала** — `DeleteCinemaUseCase` и `DeleteAuditoriumUseCase` зарегистрированы в DI, но **не имеют endpoint контроллера**.
