#!/usr/bin/env bash
# Read-only readiness check for verify-trove (stim + agent-device).
set -euo pipefail
# shellcheck source=lib.sh
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

fail=0
pass() { echo "PASS: $*"; }
fail_msg() { echo "FAIL: $*" >&2; fail=1; }

echo "verify-trove doctor"
echo "  artifacts=$VERIFY_TROVE_ARTIFACTS"

if ! command -v stim >/dev/null 2>&1; then
  fail_msg "stim not on PATH (install stim-cli / fix PATH)"
else
  pass "stim on PATH ($(stim --version 2>/dev/null | head -1 || echo ok))"
fi

if ! command -v agent-device >/dev/null 2>&1; then
  fail_msg "agent-device not on PATH"
else
  pass "agent-device on PATH ($(agent-device --version 2>/dev/null | head -1 || echo ok))"
fi

if [[ ! -d "$MOBILE_APP" ]]; then
  fail_msg "mobile app missing at $MOBILE_APP"
else
  pass "mobile app dir present"
fi

UDID=""
if UDID="$(resolve_udid 2>/dev/null)"; then
  pass "udid resolved: $UDID"
  VERIFY_TROVE_UDID="$UDID"
  export VERIFY_TROVE_UDID
else
  fail_msg "could not resolve stim-owned UDID — run launch.sh first"
fi

METRO_PORT="$(resolve_metro_port)"
VERIFY_TROVE_METRO_PORT="$METRO_PORT"
export VERIFY_TROVE_METRO_PORT
echo "  metro_port=$METRO_PORT"

if [[ -n "$UDID" ]] && xcrun simctl list devices | rg -q "${UDID}.*Booted"; then
  pass "udid booted"
else
  fail_msg "udid ${UDID:-unknown} is not booted"
fi

if metro_listening; then
  pass "Metro /status healthy on :$METRO_PORT"
else
  fail_msg "Metro not healthy on http://127.0.0.1:${METRO_PORT}/status — run launch.sh / stim start from apps/mobile"
fi

# Workspace ownership: stim status should list this mobile path with matching udid.
if command -v stim >/dev/null 2>&1; then
  stim status --json >"$VERIFY_TROVE_ARTIFACTS/doctor-stim-status.json" 2>"$VERIFY_TROVE_ARTIFACTS/doctor-stim-status.stderr.log" || true
  if python3 - "$MOBILE_APP" "$UDID" "$VERIFY_TROVE_ARTIFACTS/doctor-stim-status.json" <<'PY'
import json, sys
mobile, udid, path = sys.argv[1], sys.argv[2], sys.argv[3]
try:
    data = json.load(open(path))
except Exception:
    sys.exit(1)
for env in data.get("environments") or []:
    p = (env.get("path") or "").rstrip("/")
    ios = env.get("ios") or {}
    if p == mobile.rstrip("/") and (ios.get("udid") or "") == udid:
        sys.exit(0)
sys.exit(1)
PY
  then
    pass "stim status owns this workspace + udid"
  else
    echo "WARN: stim status did not confirm ownership for $MOBILE_APP / $UDID (continuing if device is booted)"
  fi
fi

if [[ -n "$UDID" ]]; then
  agent_device open "$VERIFY_TROVE_BUNDLE_ID" \
    --platform ios \
    --udid "$UDID" \
    --session "$VERIFY_TROVE_SESSION" \
    --metro-host 127.0.0.1 \
    --metro-port "$METRO_PORT" \
    --launch-url "trove://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A${METRO_PORT}" \
    --foreground \
    >"$VERIFY_TROVE_ARTIFACTS/doctor-open.txt" 2>&1 || fail_msg "agent-device open failed"

  agent_device alert accept --session "$VERIFY_TROVE_SESSION" >/dev/null 2>&1 || true
  sleep 2
  SNAP=""
  for _try in 1 2 3 4 5; do
    SNAP="$(agent_device snapshot -i --session "$VERIFY_TROVE_SESSION" 2>&1 || true)"
    if printf '%s' "$SNAP" | rg -qi 'RUNNER_BUSY|still finishing a previous command'; then
      sleep 3
      continue
    fi
    break
  done
  # Fall back to the open command's initial snapshot when follow-up capture is busy.
  if printf '%s' "$SNAP" | rg -qi 'RUNNER_BUSY|Error \('; then
    SNAP="$(cat "$VERIFY_TROVE_ARTIFACTS/doctor-open.txt" 2>/dev/null || true)"
  fi
  printf '%s\n' "$SNAP" | tee "$VERIFY_TROVE_ARTIFACTS/doctor-snapshot.txt" >/dev/null
  if printf '%s' "$SNAP" | rg -qi 'Open in .Trove|Open in “Trove'; then
    agent_device alert accept --session "$VERIFY_TROVE_SESSION" >/dev/null 2>&1 \
      || agent_device press 'label="Open"' --settle --session "$VERIFY_TROVE_SESSION" >/dev/null 2>&1 \
      || true
    sleep 2
    SNAP="$(agent_device snapshot -i --session "$VERIFY_TROVE_SESSION" 2>&1 || true)"
    printf '%s\n' "$SNAP" | tee "$VERIFY_TROVE_ARTIFACTS/doctor-snapshot.txt" >/dev/null
  fi
  if [[ -z "${SNAP//[[:space:]]/}" ]]; then
    fail_msg "agent-device snapshot returned empty"
  elif printf '%s' "$SNAP" | rg -qi 'Searching for development servers|DEVELOPMENT SERVERS|Enter URL manually|Expo Go|incompatible with this version|Could not connect to the server'; then
    fail_msg "snapshot shows Expo launcher/Go error, not Trove JS — re-run launch.sh"
  elif printf '%s' "$SNAP" | rg -qi 'authorized ledger could not load'; then
    fail_msg "ledger gate failure — usually a stale native binary. Re-run with VERIFY_TROVE_FORCE_BUILD=1"
  elif printf '%s' "$SNAP" | rg -qi 'Plant your first seed|Create transaction|Name your first plot|Open Trove|Erase local data from this device|Your garden is planted|No currency workspace yet|Set up Envelopes|Profile & household|Recent Journal'; then
    pass "snapshot shows Trove app chrome"
  else
    fail_msg "snapshot did not show recognizable Trove chrome (see doctor-snapshot.txt)"
  fi

  # Release the device so Maestro / later drives are not blocked by this probe session.
  agent_device close --session "$VERIFY_TROVE_SESSION" >/dev/null 2>&1 || true
fi

if [[ "$fail" -ne 0 ]]; then
  echo "doctor: FAILED" >&2
  exit 1
fi
echo "doctor: OK"
exit 0
