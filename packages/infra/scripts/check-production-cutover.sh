#!/usr/bin/env bash
set -euo pipefail

stage="${ALCHEMY_STAGE:-prod}"
missing=0

for name in \
  CLOUDFLARE_API_TOKEN \
  CLOUDFLARE_ACCOUNT_ID \
  CORS_ORIGIN \
  BETTER_AUTH_SECRET \
  PLANETSCALE_HOST \
  PLANETSCALE_DATABASE \
  PLANETSCALE_USER \
  PLANETSCALE_PASSWORD \
  POWERSYNC_URL \
  POWERSYNC_JWT_PRIVATE_KEY \
  POWERSYNC_JWT_KID; do
  if [ -z "${!name:-}" ]; then
    printf 'Missing required deployment secret: %s\n' "$name" >&2
    missing=1
  fi
done

if [ "$missing" -ne 0 ]; then
  exit 1
fi

if [ "$stage" = "prod" ] && [ "${PLANETSCALE_CUTOVER_APPROVED:-}" != "issue-173-approved" ]; then
  printf '%s\n' \
    'Production PlanetScale cutover is blocked. Close #173, finish D1 export/import parity, then set repository variable PLANETSCALE_CUTOVER_APPROVED=issue-173-approved.' >&2
  exit 1
fi

printf 'Deployment preflight passed for stage %s.\n' "$stage"
