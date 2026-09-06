# Film contracts and exhibition rights

This module replaces direct movie CRUD with a traceable workflow:

`Contract intake → OCR/model extraction → MovieManager review → Admin approval/sign-off → Admin activation → movie linkage, exhibition rights, and revenue-share policy.`

## Roles and lifecycle

- **Admin** publishes templates, approves, signs, activates, suspends/terminates contracts, and approves metadata changes.
- **MovieManager** works only on assigned dossiers: upload, retry OCR, correct extraction drafts, submit for approval, and propose metadata changes. This role cannot directly create, edit, delete, or activate a movie.
- **TheaterManager** schedules only from activated exhibition rights and must respect cinema, format, and time constraints.

Lifecycle states are `DRAFT`, `PENDING_REVIEW`, `READY_TO_SIGN`, `SIGNED`, `ACTIVATED`, `SUSPENDED`, `TERMINATED`, and `CANCELLED`. Sign-off and activation are tied to a document revision and content hash; the original partner document remains unchanged.

Cinema and format scope use `SPECIFIED`, `NO_ADDITIONAL_RESTRICTION_CONFIRMED`, or `UNRESOLVED`. An empty field never silently means unrestricted scope or a 50/50 split.

## APIs, OCR, storage, and local model

The read endpoint `GET /api/movieManager/movies` remains scoped. Legacy direct write endpoints return `410 MOVIE_DIRECT_MUTATION_DISABLED` and perform no database, upload, or job mutation.

The module exposes `/api/contracts`, `/api/contract-templates`, and `/api/movies/{id}/change-requests`. Only Admin can approve, sign, activate, or apply a change request. Activation is transactional and idempotent per revision.

The Python service reads PDF text layers, renders/OCRs scans with Tesseract `vie+eng`, and asks a local model to propose structured data. Model output is always reviewed before activation.

Development and Testing store private contract files in MinIO. Production retains the backend's existing storage path. Docker uses Ollama with `qwen3.5:4b`, requires no API key, disables reasoning mode, and requests JSON output.

## Docker verification

```powershell
docker compose -p galaxiad-contract-test -f infrastructure/docker/compose.test.yml up -d --build mssql redis qdrant minio ollama ollama-init ai-http api
docker compose -p galaxiad-contract-test -f infrastructure/docker/compose.test.yml build test-runner
docker compose -p galaxiad-contract-test -f infrastructure/docker/compose.test.yml run --rm --no-deps test-runner python3 -m pytest -q services/ai/tests/test_contract_docker_integration.py
```

The integration suite does not mock MinIO, OCR, the model, or HTTP. It creates a contract image, performs a real MinIO round trip, runs real OCR/model extraction, and verifies that the contract API rejects unauthenticated access.

## Test audit, 2026-09-07

- .NET: 71 passing (51 unit, 16 integration, 4 API flow).
- Frontend: 114 passing.
- Python AI: 54 passing, 4 skipped (Docker-only checks run in the test runner).
- Docker contract suite: 4 passing without API keys.
- Several backend tests named “Integration” use InMemory/Moq; they validate use-case behavior but do not prove SQL/Redis integration. The Docker contract suite covers the new real-service path.
- Frontend tests pass with existing i18n initialization and React `act` warnings; Python also reports LangChain deprecations. These should be cleaned up for quieter CI output.
