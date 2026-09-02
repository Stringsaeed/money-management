#!/usr/bin/env bash
# Shared constants for verify-trove helpers.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
ARGENT="${ROOT}/node_modules/.bin/argent"

VERIFY_TROVE_UDID="${VERIFY_TROVE_UDID:-D1509E32-FDCD-4788-93A3-DB775B256CFA}"
VERIFY_TROVE_BUNDLE_ID="${VERIFY_TROVE_BUNDLE_ID:-com.stringsaeed.moneymanagement}"
VERIFY_TROVE_RUN_ID="${VERIFY_TROVE_RUN_ID:-$(date +%Y%m%d-%H%M%S)}"
VERIFY_TROVE_ARTIFACTS="${VERIFY_TROVE_ARTIFACTS:-${ROOT}/.cursor/skills/verify-trove/artifacts/${VERIFY_TROVE_RUN_ID}}"

export ROOT ARGENT VERIFY_TROVE_UDID VERIFY_TROVE_BUNDLE_ID VERIFY_TROVE_RUN_ID VERIFY_TROVE_ARTIFACTS

mkdir -p "$VERIFY_TROVE_ARTIFACTS"

argent_run() {
  if [[ ! -x "$ARGENT" ]]; then
    echo "doctor: missing $ARGENT — run pnpm install from repo root" >&2
    return 127
  fi
  "$ARGENT" run "$@"
}

metro_listening() {
  curl -sf "http://127.0.0.1:8081/status" >/dev/null 2>&1
}
