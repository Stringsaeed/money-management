#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")" && pwd)"
check="$root/check-production-cutover.sh"

common=(
  CLOUDFLARE_API_TOKEN=test
  CLOUDFLARE_ACCOUNT_ID=00000000000000000000000000000000
  CORS_ORIGIN=http://localhost:8081
  WORKOS_API_KEY=test
  WORKOS_CLIENT_ID=client_test
  PLANETSCALE_HOST=postgres.example.test
  PLANETSCALE_DATABASE=postgres
  PLANETSCALE_USER=test
  PLANETSCALE_PASSWORD=test
  POWERSYNC_URL=https://powersync.example.test
  POWERSYNC_JWT_PRIVATE_KEY=test
  POWERSYNC_JWT_KID=test
)

env "${common[@]}" ALCHEMY_STAGE=dev bash "$check" >/dev/null
env "${common[@]}" ALCHEMY_STAGE=prod PLANETSCALE_CUTOVER_APPROVED=issue-173-approved \
  bash "$check" >/dev/null

if env "${common[@]}" ALCHEMY_STAGE=prod bash "$check" >/dev/null 2>&1; then
  printf 'expected production preflight to reject a missing cutover approval\n' >&2
  exit 1
fi

if env "${common[@]}" PLANETSCALE_PASSWORD= ALCHEMY_STAGE=dev bash "$check" >/dev/null 2>&1; then
  printf 'expected deployment preflight to reject a missing PlanetScale password\n' >&2
  exit 1
fi

printf 'cutover preflight checks passed\n'
