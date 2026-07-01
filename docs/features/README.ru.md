# 📚 Инвентарь функций — Galaxiad Cinema

> Подробная документация всех функций системы. [English](README.en.md) | [Tiếng Việt](README.vi.md)

---

## Список функций

### 👤 Пользователь
| Функция | Файл | Описание |
|---|---|---|
| [Аутентификация](./ru/authentication.md) | `authentication.md` | 8 endpoints (Регистрация, Вход, Google OAuth, Профиль) |
| [Индивидуальное бронирование](./ru/booking.md) | `booking.md` | 11 endpoints (Выбор мест, VNPay, PDF) |
| [Каталог фильмов](./ru/movie-catalog.md) | `movie-catalog.md` | 17 endpoints (Сейчас, Скоро, Детали, Поиск) |
| [Комментарии и отзывы](./ru/comments-reviews.md) | `comments-reviews.md` | 8 endpoints (Отзывы, Ответы, AI-модерация, Тренды) |
| [Групповое бронирование](./ru/social-booking.md) | `social-booking.md` | 20 endpoints (Группы, Пары, Голосование, Чат, Оплата) |

### 🤖 ИИ
| Функция | Файл | Описание |
|---|---|---|
| [AI Чат-бот](./ru/ai-chatbot.md) | `ai-chatbot.md` | 2 endpoints (Чат, Стрим) |
| [AI Рекомендации](./ru/ai-recommendations.md) | `ai-recommendations.md` | 4 endpoints (Опрос, Рекомендации) |

### 💰 Бизнес-операции
| Функция | Файл | Описание |
|---|---|---|
| [POS Касса](./ru/cashier-pos.md) | `cashier-pos.md` | TBD (POS — общие Booking + Department) |
| [Портал сотрудника](./ru/staff-portal.md) | `staff-portal.md` | 11 endpoints (Смены, Чек-ин/аут, Зарплата) |

### 🏢 Администрирование
| Функция | Файл | Описание |
|---|---|---|
| [Панель администратора](./ru/admin.md) | `admin.md` | 30+ endpoints (Пользователи, RBAC, Ваучеры, Цены, Аудит, Jobs) |
| [Управление объектами](./ru/facilities.md) | `facilities.md` | 13 endpoints (Кинотеатры, Залы, Места) |
| [Управление фильмами](./ru/movie-manager.md) | `movie-manager.md` | 5 endpoints (CRUD, Форматы, Жанры) |
| [Управление театром](./ru/theater-manager.md) | `theater-manager.md` | 27 endpoints (Расписание, AI Рекомендации, Смены, Дашборд) |

---

## Статистика

| Категория | Количество |
|---|---|
| Всего функций | 13 |
| API Контроллеров | 29 |
| API Endpoints | ~164 |
| Use Cases | 167 |
| Языки i18n | 3 (EN/VI/RU) |

---

## Связанные разделы

- [Алгоритмы](../algorithms/README.ru.md) — Документация алгоритмов
- [Бизнес-правила](../business/README.ru.md) — Справочник бизнес-правил
