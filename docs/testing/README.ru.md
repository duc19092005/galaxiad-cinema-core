# 🧪 Архитектура и каталог тестирования системы (Cinema Testing System)

[🇻🇳 Tiếng Việt](README.md) | [🇬🇧 English](README.en.md) | [🇷🇺 Русский](README.ru.md)

В этом документе описывается архитектура автоматизированного тестирования, каталог матриц тест-кейсов и механизм контроля качества (CI Gate) **Комплексной системы управления кинотеатром (Galaxiad Cinema Core)**.

---

## 1. Базовые принципы тестирования

1. **Категорический отказ от фиктивных тестов (Zero Fake Passes)**: Все тесты выполняют реальный рабочий код без мокирования тестируемой системы (SUT).
2. **Аутентичные криптографические подписи**: Реальный расчёт контрольной суммы HMAC-SHA512 для платёжного шлюза VNPay; полноценная проверка JWT-токенов и ролей.
3. **Конкурентность и состояния гонки (Concurrency & Race Conditions)**: Тщательная проверка распределённых замков мест в Redis, списания ваучеров с единичным остатком и идемпотентности вебхуков.
4. **Изоляция кинотеатров (Tenancy Isolation)**: Строгое разделение прав доступа между филиалами; управляющий кинотеатром А не может изменять расписание или просматривать финансовые показатели кинотеатра Б.
5. **Обязательный шлюз CI перед слиянием в `main`**: 100% тестов бэкенда, фронтенда и AI-сервиса должны успешно завершиться до подтверждения слияния кода в основную ветку `main`.

---

## 2. Архитектура тестовых наборов

```
galaxiad-cinema-core/
├── apps/backend/
│   ├── Cinema.Testing/             # Общие фикстуры, MockJwtTokenHelper, VnPayTestHelper, In-Memory DB
│   ├── Cinema.Tests.Unit/          # 51 модульный тест (Use cases, контроллеры, политики, сервисы)
│   ├── Cinema.Tests.Integration/   # 16 интеграционных тестов (БД, VNPay HMAC-SHA512, замки Redis, джобы)
│   └── Cinema.Tests.ApiFlows/      # 4 сквозных теста API и жизненного цикла SignalR CinemaHub
├── apps/frontend/
│   └── src/__tests__/              # 114 тестов Vitest (19 тестовых файлов)
│       ├── api/                    # Axios-клиент, дедупликация обновления токенов, перехватчики
│       ├── hooks/                  # Хук WebSocket / SignalR блокировки мест (useSeatWs)
│       ├── utils/                  # Политики выбора мест, утилиты авторизации
│       ├── components/             # ProtectedRoute, Header, навигация
│       └── features/               # Чат-бот (action cards), POS-касса, бронирование, управление фильмами
├── services/ai/
│   └── tests/                      # Набор тестов Pytest (FastAPI, эмбеддинги рекомендаций, LLM-агент)
└── docs/testing/
    ├── README.md                   # Обзор тестирования (Вьетнамский)
    ├── README.en.md                # Обзор тестирования (Английский)
    ├── README.ru.md                # Обзор тестирования (Русский)
    ├── catalog.md                  # Каталог матрицы 47 тест-кейсов (Вьетнамский)
    ├── catalog.en.md               # Каталог матрицы 47 тест-кейсов (Английский)
    ├── catalog.ru.md               # Каталог матрицы 47 тест-кейсов (Русский)
    ├── inventory.json              # Полный каталог 187 use cases, контроллеров и сервисов
    ├── testcases.json              # Структурированные тест-кейсы в формате JSON
    └── testcases.schema.json       # Схема валидации JSON Schema для каталога
```

---

## 3. Бизнес-матрица тестирования

Полная матрица из 47 тест-кейсов доступна на трёх языках:
- 🇻🇳 **[Bảng Ma Trận Kiểm Thử Tiếng Việt](catalog.md)**
- 🇬🇧 **[English Test Matrix Catalog](catalog.en.md)**
- 🇷🇺 **[Русская тестовая матрица](catalog.ru.md)**

### Распределение по приоритетам:
- **P0 (29 тест-кейсов)**: Финансы, платёжный шлюз VNPay, цифровые подписи, блокировка мест в Redis, многозальный RBAC, автоотмена просроченных заказов.
- **P1 (17 тест-кейсов)**: Составление расписания, генерация схем залов, учет смен персонала, учет рабочего времени по лицу, клиентский AI-чат и рекомендации.
- **P2 (1 тест-кейс)**: Отзывы к фильмам, автоматическая модерация контента AI.

---

## 4. Запуск тестов

### Бэкенд (.NET 8):
```bash
dotnet test apps/backend/Backend.sln --logger:"console;verbosity=minimal"
# Ожидаемый результат: 71/71 tests PASSED (100% GREEN)
```

### Фронтенд (React 19 + TypeScript + Vitest):
```bash
cd apps/frontend
npm test           # Запуск всех 114 модульных и компонентных тестов
npm run build      # Проверка строгой типизации TypeScript + сборка Vite
```

### AI-сервис (Python 3.11 + Pytest):
```bash
cd services/ai
pytest tests
```

### Запуск в Docker без установки локальных SDK:
```bash
# Windows PowerShell
./infrastructure/scripts/test.ps1

# Linux / macOS Bash
./infrastructure/scripts/test.sh
```

---

## 5. Шлюз CI и защита веток `dev` и `main`

Конвейер GitHub Actions CI (`.github/workflows/build.yml`) автоматически запускается при создании Pull Request в ветки `dev`, `develop` или `main`, а также при прямом Push:

1. **`build-backend`**: Сборка Release и выполнение всех 71 тестов .NET.
2. **`build-frontend`**: Выполнение всех 114 тестов Vitest и сборка продакшн-бандла (`npm run build`).
3. **`build-ai`**: Проверка синтаксиса и запуск тестов Pytest.
4. **`all-tests-passed` (Gate)**: Блокирует слияние кода в `dev` или `main`, если хотя бы один тест завершился ошибкой.

> [!IMPORTANT]
> **Настройка защиты веток в GitHub (Branch Protection) для ОБЕИХ веток `main` И `dev`:**
> Перейдите в **Settings** -> **Branches** -> **Add branch protection rule** (повторите для `main` и для `dev`):
> - **Branch name pattern**: Введите `main` (Правило 1), затем повторите и введите `dev` (Правило 2).
> - Включите **Require status checks to pass before merging**.
> - Выберите проверку: `All Tests Passed Gate (Required for Main & Dev Merge)`.
> Это гарантирует, что ни один Pull Request не сможет быть объединён ни с `dev`, ни с `main` без успешной сборки и прохождения всех автоматических тестов.
