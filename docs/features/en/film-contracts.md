# Film contracts and exhibition rights

This module replaces direct movie CRUD with a traceable workflow:

`Admin upload → immediate OCR/model extraction → optional MovieManager assignment → before/after reconciliation → Admin sign-off → activation → movie linkage, exhibition rights, and revenue-share policy.`

## Roles and lifecycle

- **Admin** uploads dossiers, reviews OCR, filters by partner, optionally assigns an active MovieManager, publishes templates, approves, signs, activates, suspends/terminates contracts, and approves metadata changes. Admin is no longer shown a misleading “send to Admin” action; Admin can go directly to sign-off when no reviewer is needed.
- **MovieManager** works only on assigned dossiers: upload, retry OCR, correct extraction drafts, submit for approval, and propose metadata changes. This role cannot directly create, edit, delete, or activate a movie.
- **TheaterManager** schedules only from activated exhibition rights and must respect cinema, format, and time constraints.

Lifecycle states are `DRAFT`, `PENDING_REVIEW`, `READY_TO_SIGN`, `SIGNED`, `ACTIVATED`, `SUSPENDED`, `TERMINATED`, and `CANCELLED`. Uploading a PDF/PNG/JPEG stores an immutable original and starts OCR. Admin can list active reviewers with `GET /api/contracts/reviewers` and assign one with `POST /api/contracts/{id}/assign`; the reviewer can only access assigned dossiers.

MovieManager edits the extraction draft through `PUT /api/contracts/{id}/extraction-review`. Each save records actor, time, and before/after JSON in the revision, and the UI presents the original OCR beside the reconciled values. MovieManager submits with `/submit`; Admin reviews, confirms the password, records internal sign-off, and activates. Internal sign-off is an approval record for the revision, not a claim of a certified digital certificate.

Cinema and format scope use `SPECIFIED`, `NO_ADDITIONAL_RESTRICTION_CONFIRMED`, or `UNRESOLVED`. An empty field never silently means unrestricted scope or a 50/50 split.

## APIs, OCR, storage, and local model

The read endpoint `GET /api/movieManager/movies` remains scoped. Legacy direct write endpoints return `410 MOVIE_DIRECT_MUTATION_DISABLED` and perform no database, upload, or job mutation.

The module exposes `/api/contracts`, `/api/contract-templates`, and `/api/movies/{id}/change-requests`. Only Admin can approve, sign, activate, or apply a change request. Activation is transactional and idempotent per revision.

### How OCR is processed

1. Admin selects a PDF, PNG, or JPEG. The backend validates the extension, file signature, size (25 MB/file; 50 MB/job), and page count (50 maximum), then stores an immutable original in MinIO locally/in tests or production storage. SHA-256 identifies the exact source.
2. A background job is created for `contractId` and `revisionId`; the UI stays responsive and an old job cannot overwrite a new revision.
3. Python reads each PDF text layer with `pdfplumber`. If usable text is absent, it renders the page with `pypdfium2`, converts it to grayscale with contrast enhancement, and runs Tesseract `vie+eng`. Uploaded images use the same OCR path.
4. Text is retained per page with the method (`pdf_text`/`ocr`), warnings, and source location. Reviewers can open the exact source page instead of trusting one flattened string.
5. Page-labelled text is sent to local Ollama `qwen3.5:4b` in dev/test. The model proposes JSON for licensor/partner, counterparty number, movies, description, poster URL, director, actors, dates, cinema/format scope, shares, clauses, conflicts, and unresolved fields. Documents are untrusted data; the model has no database mutation tool.
6. The service validates the schema. Invalid or incomplete JSON becomes `UNRESOLVED`; an empty response is not success. Missing shares, dates, poster, or description remain unresolved; the system never invents 50/50, default dates, or an Internet URL.
7. The frontend maps values into a draft. Cinema and format names become IDs only after catalog matching; “the whole chain” remains unrestricted scope instead of a fake cinema. Invalid dates, unknown age ratings, and unmatched cinema names remain for human review.
8. Admin may reconcile personally or assign MovieManager. Every save records actor, time, and before/after JSON; the UI shows the original OCR beside corrected values and source text.
9. Only confirmed required fields and financial policy can be submitted/approved. OCR never creates a movie; movies, rights, and policy are created only after Admin signs and activates the revision.
10. Temporary failures are retried by the job; invalid files, unreadable pages, and invalid model JSON remain attached with an error code, without duplicate dossiers.

OCR/model extraction is evidence-backed assistance, not contract sign-off or an autonomous legal/financial decision.

Development and Testing store private contract files in MinIO. Production retains the backend's existing storage path. Docker uses Ollama with `qwen3.5:4b`, requires no API key, disables reasoning mode, and requests JSON output.

Partner is optional at intake. The Admin list can filter by partner; the partner is extracted from the licensor/distributor section and then confirmed by a human. Optional fields are never invented: missing description, poster, dates, classification, scope, or share values remain unresolved and block approval when required. `SPECIFIED` is used only when cinema/format names map to the catalog; “all cinemas in the chain” remains `NO_ADDITIONAL_RESTRICTION_CONFIRMED` instead of becoming a fake cinema name.

The PDFs in `sample-contracts/` are explicitly marked demo data and include Unicode Vietnamese, partner details, descriptions, and poster URLs. Movie descriptions use `nvarchar(2048)`; existing `?` characters must be re-imported from the source because lost encoding cannot be reconstructed.

## Docker verification

```powershell
docker compose -p galaxiad-contract-test -f infrastructure/docker/compose.test.yml up -d --build mssql redis qdrant minio ollama ollama-init ai-http api
docker compose -p galaxiad-contract-test -f infrastructure/docker/compose.test.yml build test-runner
docker compose -p galaxiad-contract-test -f infrastructure/docker/compose.test.yml run --rm --no-deps test-runner python3 -m pytest -q services/ai/tests/test_contract_docker_integration.py
```

The integration suite does not mock MinIO, OCR, the model, or HTTP. It creates a contract image, performs a real MinIO round trip, runs real OCR/model extraction, and verifies that the contract API rejects unauthenticated access.

## Test audit, 2026-09-07

- .NET contract/unit suite: 63 passing.
- Frontend build and OCR mapper: build passed, 3 tests passed.
- Python AI: 59 passed; the added OCR schema checks pass 5 tests.
- Docker live workflow: 1 passed with real SQL Server, MinIO, OCR, Ollama, API, and Admin/MovieManager accounts; no API key.
- Docker smoke contract checks cover MinIO round-trip, local model, image OCR, and API 401 without an API key.
- Several backend tests named “Integration” use InMemory/Moq; they validate use-case behavior but do not prove SQL/Redis integration. The Docker contract suite covers the new real-service path.
- Frontend tests pass with existing i18n initialization and React `act` warnings; Python also reports LangChain deprecations. These should be cleaned up for quieter CI output.
