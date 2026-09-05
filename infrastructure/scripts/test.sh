#!/usr/bin/env bash
set -eo pipefail

SUITE="${1:-unit}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_TEST="$SCRIPT_DIR/../docker/compose.test.yml"

echo -e "\033[36m====================================================\033[0m"
echo -e "\033[36m  CINEMA TEST RUNNER: Mode = $SUITE\033[0m"
echo -e "\033[36m====================================================\033[0m"

run_unit() {
    echo -e "\n\033[33m>>> [1/2] Running .NET Unit Tests...\033[0m"
    dotnet test "$ROOT_DIR/apps/backend/Backend.sln" -c Release --logger "trx;LogFileName=unit-results.trx"

    echo -e "\n\033[33m>>> [2/2] Running Python AI Unit Tests...\033[0m"
    cd "$ROOT_DIR/services/ai"
    python3 -m pytest tests/unit -v --tb=short

    echo -e "\n\033[32m>>> ALL UNIT TESTS PASSED DETERMINISTICALLY! <<<\033[0m"
}

run_full() {
    echo -e "\n\033[33m>>> Starting Test Stack via Docker Compose (-p cinema-test)...\033[0m"
    docker compose -f "$COMPOSE_TEST" -p cinema-test up -d --build --wait mssql redis qdrant ai-http

    echo -e "\n\033[33m>>> Running Complete Test Suite...\033[0m"
    dotnet test "$ROOT_DIR/apps/backend/Backend.sln" -c Release --logger "trx;LogFileName=full-results.trx"

    echo -e "\n\033[33m>>> Tearing down test stack...\033[0m"
    docker compose -f "$COMPOSE_TEST" -p cinema-test down

    echo -e "\n\033[32m>>> FULL TEST SUITE COMPLETED SUCCESSFULLY! <<<\033[0m"
}

run_live_ai() {
    echo -e "\n\033[33m>>> Running Live AI Smoke Suite...\033[0m"
    cd "$ROOT_DIR/services/ai"
    python3 -m pytest tests -m "live_ai" -v --tb=short
}

case "$SUITE" in
    unit)
        run_unit
        ;;
    full)
        run_full
        ;;
    live-ai)
        run_live_ai
        ;;
    *)
        echo "Unknown suite: $SUITE (Expected: unit, full, live-ai)"
        exit 1
        ;;
esac
