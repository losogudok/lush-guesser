#!/usr/bin/env bash

set -Eeuo pipefail

compose_status=0
docker compose up -d --remove-orphans || compose_status=$?
if [ "$compose_status" -eq 0 ]; then
  exit 0
fi

echo "docker compose up failed with status $compose_status; collecting backend diagnostics" >&2
docker compose ps --all || true
docker compose logs --no-color --timestamps --tail=100 backend \
  | sed -E \
    -e 's#(/bot)[0-9]+:[A-Za-z0-9_-]+#\1<REDACTED>#g' \
    -e 's#(socks5h?://)[^/@[:space:]]+@#\1<REDACTED>@#g' \
    -e 's#(TELEGRAM_(BOT_TOKEN|WEBHOOK_SECRET|BOT_PROXY_URL)[=:][[:space:]]*)[^[:space:]]+#\1<REDACTED>#g' \
  || true

exit "$compose_status"
