#!/usr/bin/env bash
#
# Runs the example application. `./run.sh up` starts MongoDB and the API,
# `./run.sh web` the frontend, `./run.sh test` the Jest suites and
# `./run.sh e2e` the Playwright suite against the running stack.
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

up() {
  # MongoDB and the API on http://localhost:3000/api
  docker compose -f docker-compose.yml up
}

web() {
  # The frontend on http://localhost:4200, proxying /api to the API
  npx nx serve web
}

unit() {
  # Jest: the model, the API services, the Angular services and pages
  npx nx run-many -t test -p model api web
}

e2e() {
  # Playwright against MongoDB on localhost:27017; the API and the frontend are started for you
  RUN_EXAMPLE_APP_E2E=1 npx nx test web-e2e
}

case "${1:-}" in
  up) up ;;
  web) web ;;
  test) unit ;;
  e2e) e2e ;;
  *)
    echo "usage: $0 up|web|test|e2e" >&2
    exit 64
    ;;
esac
