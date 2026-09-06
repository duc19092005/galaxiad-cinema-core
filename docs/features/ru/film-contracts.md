# Договоры на фильмы и права показа

Модуль заменяет прямой CRUD фильмов проверяемым процессом:

`Приём договора → OCR/анализ моделью → проверка MovieManager → одобрение/подпись Admin → активация Admin → связь фильма, права показа и политика распределения выручки.`

## Роли и жизненный цикл

- **Admin** публикует шаблоны, одобряет, подписывает, активирует, приостанавливает/завершает договоры и одобряет изменения метаданных.
- **MovieManager** работает только с назначенными досье: загружает файлы, повторяет OCR, исправляет черновик извлечения, отправляет на проверку и предлагает изменение метаданных. Роль не может напрямую создавать, изменять, удалять или включать фильм.
- **TheaterManager** формирует расписание только по активированным правам показа с учётом кинотеатра, формата и периода.

Статусы: `DRAFT`, `PENDING_REVIEW`, `READY_TO_SIGN`, `SIGNED`, `ACTIVATED`, `SUSPENDED`, `TERMINATED`, `CANCELLED`. Подпись и активация привязаны к revision и hash документа; исходный документ партнёра не меняется.

Область кинотеатров/форматов принимает `SPECIFIED`, `NO_ADDITIONAL_RESTRICTION_CONFIRMED` или `UNRESOLVED`. Пустое поле не означает неограниченный показ или долю 50/50.

## API, OCR, хранение и локальная модель

`GET /api/movieManager/movies` остаётся endpoint только для чтения. Старые операции записи возвращают `410 MOVIE_DIRECT_MUTATION_DISABLED` и не меняют БД, файлы или jobs.

Основные API: `/api/contracts`, `/api/contract-templates`, `/api/movies/{id}/change-requests`. Только Admin может одобрить, подписать, активировать или применить изменение. Активация транзакционная и идемпотентна для revision.

Python service извлекает текст PDF, выполняет OCR сканов через Tesseract `vie+eng` и просит модель предложить структурированные данные. Результат модели всегда проверяется до активации.

В Development/Testing приватные договоры хранятся в MinIO. В Production используется существующее backend-хранилище. Docker запускает Ollama с `qwen3.5:4b` без API key, с выключенным reasoning и JSON output.

## Проверка в Docker

```powershell
docker compose -p galaxiad-contract-test -f infrastructure/docker/compose.test.yml up -d --build mssql redis qdrant minio ollama ollama-init ai-http api
docker compose -p galaxiad-contract-test -f infrastructure/docker/compose.test.yml build test-runner
docker compose -p galaxiad-contract-test -f infrastructure/docker/compose.test.yml run --rm --no-deps test-runner python3 -m pytest -q services/ai/tests/test_contract_docker_integration.py
```

Интеграционный тест не мокает MinIO, OCR, модель или HTTP. Он создаёт изображение договора, выполняет реальный MinIO round trip, OCR/анализ модели и проверяет отказ API без аутентификации.

## Аудит тестов, 07.09.2026

- .NET: 71 passing (51 unit, 16 integration, 4 API flow).
- Frontend: 114 passing.
- Python AI: 54 passing, 4 skipped (Docker-проверки запускаются в test runner).
- Docker contract suite: 4 passing без API key.
- Часть backend тестов с названием `Integration` использует InMemory/Moq: они проверяют use case, но не SQL/Redis. Новый Docker test покрывает реальный путь договора.
- Frontend тесты проходят с текущими предупреждениями i18n и React `act`; Python также сообщает deprecation LangChain. Их следует устранить для чистого CI.
