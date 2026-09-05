#!/usr/bin/env bash
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_TEST="$SCRIPT_DIR/../docker/compose.test.yml"

echo -e "\033[35m====================================================\033[0m"
echo -e "\033[35m  RESETTING TEST NAMESPACE (cinema-test)\033[0m"
echo -e "\033[35m====================================================\033[0m"

docker compose -f "$COMPOSE_TEST" -p cinema-test down -v --remove-orphans

echo -e "\n\033[32m>>> Successfully wiped test containers and test volumes! <<<\033[0m"
