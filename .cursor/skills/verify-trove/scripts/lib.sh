#!/usr/bin/env bash
# Shared constants for verify-trove helpers (stim + agent-device).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
MOBILE_APP="$ROOT/apps/mobile"

VERIFY_TROVE_BUNDLE_ID="${VERIFY_TROVE_BUNDLE_ID:-com.stringsaeed.moneymanagement}"
VERIFY_TROVE_APP_NAME="${VERIFY_TROVE_APP_NAME:-Trove (Dev)}"
VERIFY_TROVE_RUN_ID="${VERIFY_TROVE_RUN_ID:-$(date +%Y%m%d-%H%M%S)}"
VERIFY_TROVE_ARTIFACTS="${VERIFY_TROVE_ARTIFACTS:-${ROOT}/.cursor/skills/verify-trove/artifacts/${VERIFY_TROVE_RUN_ID}}"
VERIFY_TROVE_SESSION="${VERIFY_TROVE_SESSION:-verify-trove}"
VERIFY_TROVE_METRO_PORT="${VERIFY_TROVE_METRO_PORT:-}"

export ROOT MOBILE_APP VERIFY_TROVE_BUNDLE_ID VERIFY_TROVE_APP_NAME
export VERIFY_TROVE_RUN_ID VERIFY_TROVE_ARTIFACTS VERIFY_TROVE_SESSION

mkdir -p "$VERIFY_TROVE_ARTIFACTS"

require_cmd() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "missing required command: $name" >&2
    return 127
  fi
}

# Resolve this workspace's stim-owned iOS UDID from stim status --json.
# Prefer VERIFY_TROVE_UDID when set; otherwise read launch.json; else query stim.
resolve_udid() {
  if [[ -n "${VERIFY_TROVE_UDID:-}" ]]; then
    printf '%s' "$VERIFY_TROVE_UDID"
    return 0
  fi
  if [[ -f "$VERIFY_TROVE_ARTIFACTS/launch.json" ]]; then
    local from_launch
    from_launch="$(python3 -c "import json;print(json.load(open('$VERIFY_TROVE_ARTIFACTS/launch.json')).get('udid') or '')" 2>/dev/null || true)"
    if [[ -n "$from_launch" ]]; then
      printf '%s' "$from_launch"
      return 0
    fi
  fi
  require_cmd stim || return 1
  python3 - "$MOBILE_APP" <<'PY'
import json, sys, subprocess
mobile = sys.argv[1]
raw = subprocess.check_output(["stim", "status", "--json"], text=True)
data = json.loads(raw)
envs = data.get("environments") or []
for env in envs:
    path = env.get("path") or ""
    if path.rstrip("/") == mobile.rstrip("/") or path.endswith("/apps/mobile") and mobile in path:
        ios = env.get("ios") or {}
        udid = ios.get("udid") or ""
        if udid:
            print(udid)
            sys.exit(0)
# Prefer the environment marked current / matching exact mobile path
for env in envs:
    if (env.get("path") or "").rstrip("/") == mobile.rstrip("/"):
        ios = env.get("ios") or {}
        udid = ios.get("udid") or ""
        if udid:
            print(udid)
            sys.exit(0)
sys.exit(1)
PY
}

resolve_metro_port() {
  if [[ -n "${VERIFY_TROVE_METRO_PORT:-}" ]]; then
    printf '%s' "$VERIFY_TROVE_METRO_PORT"
    return 0
  fi
  if [[ -f "$VERIFY_TROVE_ARTIFACTS/launch.json" ]]; then
    local from_launch
    from_launch="$(python3 -c "import json;print(json.load(open('$VERIFY_TROVE_ARTIFACTS/launch.json')).get('metro_port') or '')" 2>/dev/null || true)"
    if [[ -n "$from_launch" ]]; then
      printf '%s' "$from_launch"
      return 0
    fi
  fi
  printf '%s' "8081"
}

agent_device() {
  require_cmd agent-device || return 127
  agent-device "$@"
}

# Open (or reuse) the agent-device session bound to the verify stim sim + Metro.
agent_device_open() {
  local udid port relaunch_flag=(--foreground)
  udid="$(resolve_udid)" || {
    echo "could not resolve VERIFY_TROVE_UDID — run launch.sh first" >&2
    return 1
  }
  port="$(resolve_metro_port)"
  if [[ "${1:-}" == "--relaunch" ]]; then
    relaunch_flag=(--relaunch)
    shift || true
  fi
  # Prefer --udid (stim fact). --device matches display name and is ambiguous across stim-mobile clones.
  agent_device open "$VERIFY_TROVE_BUNDLE_ID" \
    --platform ios \
    --udid "$udid" \
    --session "$VERIFY_TROVE_SESSION" \
    --metro-host 127.0.0.1 \
    --metro-port "$port" \
    "${relaunch_flag[@]}" \
    "$@"
}

metro_listening() {
  local port
  port="$(resolve_metro_port)"
  curl -sf "http://127.0.0.1:${port}/status" >/dev/null 2>&1
}
