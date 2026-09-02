#!/usr/bin/env bash
# Read-only readiness check for verify-trove.
set -euo pipefail
# shellcheck source=lib.sh
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

fail=0
pass() { echo "PASS: $*"; }
fail_msg() { echo "FAIL: $*" >&2; fail=1; }

echo "verify-trove doctor"
echo "  udid=$VERIFY_TROVE_UDID"
echo "  bundle=$VERIFY_TROVE_BUNDLE_ID"
echo "  artifacts=$VERIFY_TROVE_ARTIFACTS"

if ! "$ARGENT" server status 2>/dev/null | tee "$VERIFY_TROVE_ARTIFACTS/doctor-server.txt" | rg -q "health:\\s+ok"; then
  fail_msg "argent tool-server not healthy (argent server status)"
else
  pass "argent tool-server healthy"
fi

devices_json="$(argent_run list-devices 2>&1 | tee "$VERIFY_TROVE_ARTIFACTS/doctor-devices.txt" || true)"
if ! printf '%s' "$devices_json" | rg -q "$VERIFY_TROVE_UDID"; then
  fail_msg "udid $VERIFY_TROVE_UDID not present in list-devices"
else
  pass "udid present in list-devices"
fi

if ! xcrun simctl list devices | rg -q "${VERIFY_TROVE_UDID}.*Booted"; then
  fail_msg "udid $VERIFY_TROVE_UDID is not booted"
else
  pass "udid booted"
fi

if curl -sf "http://127.0.0.1:8081/status" >/dev/null 2>&1; then
  pass "Metro /status healthy on :8081"
else
  fail_msg "Metro not healthy on http://127.0.0.1:8081/status"
fi

if debugger_out="$(argent_run debugger-status 2>&1 | tee "$VERIFY_TROVE_ARTIFACTS/doctor-debugger.txt")"; then
  if printf '%s' "$debugger_out" | rg -qi 'metro_not_running'; then
    fail_msg "debugger-status reports metro_not_running"
  else
    pass "debugger-status does not report metro_not_running"
  fi
else
  echo "WARN: debugger-status unavailable; relying on /status check"
fi

if ! argent_run launch-app --udid "$VERIFY_TROVE_UDID" --bundleId "$VERIFY_TROVE_BUNDLE_ID" 2>&1 | tee "$VERIFY_TROVE_ARTIFACTS/doctor-launch.txt"; then
  fail_msg "launch-app failed — is $VERIFY_TROVE_BUNDLE_ID installed?"
else
  pass "launch-app succeeded"
fi

sleep 2
describe_out="$(argent_run describe --udid "$VERIFY_TROVE_UDID" --bundleId "$VERIFY_TROVE_BUNDLE_ID" 2>&1 | tee "$VERIFY_TROVE_ARTIFACTS/doctor-describe.txt" || true)"
if [[ -z "${describe_out//[[:space:]]/}" ]]; then
  fail_msg "describe returned empty tree"
elif printf '%s' "$describe_out" | rg -qi 'Searching for development servers|DEVELOPMENT SERVERS|Enter URL manually|Expo Go|incompatible with this version|Could not connect to the server'; then
  fail_msg "describe shows Expo launcher/Go error, not the Trove JS app — open trove://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081"
elif printf '%s' "$describe_out" | rg -qi 'authorized ledger could not load'; then
  fail_msg "ledger gate failure — usually a stale native binary (ExpoSecureStore). Re-run with VERIFY_TROVE_FORCE_BUILD=1"
elif printf '%s' "$describe_out" | rg -qi 'Plant your first seed|Create transaction|Name your first plot|Open Trove|Erase All Data|Your garden is planted|Budget envelopes are coming soon'; then
  pass "describe shows Trove app chrome"
else
  fail_msg "describe did not show recognizable Trove app chrome (see doctor-describe.txt)"
fi

if [[ "$fail" -ne 0 ]]; then
  echo "doctor: FAILED" >&2
  exit 1
fi
echo "doctor: OK"
exit 0
