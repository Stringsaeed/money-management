#!/usr/bin/env bash
# Tear down processes this verification run started. Never deletes evidence.
set -euo pipefail
# shellcheck source=lib.sh
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

LAUNCH_JSON="$VERIFY_TROVE_ARTIFACTS/launch.json"

echo "verify-trove cleanup"
echo "  artifacts=$VERIFY_TROVE_ARTIFACTS (retained)"

# Close agent-device session if present (best-effort).
if command -v agent-device >/dev/null 2>&1; then
  agent-device close --session "$VERIFY_TROVE_SESSION" >/dev/null 2>&1 || true
  echo "closed agent-device session $VERIFY_TROVE_SESSION (if open)"
fi

UDID="$(resolve_udid 2>/dev/null || true)"
if [[ -n "$UDID" ]] && xcrun simctl list devices | rg -q "${UDID}.*Booted"; then
  xcrun simctl terminate "$UDID" "$VERIFY_TROVE_BUNDLE_ID" 2>/dev/null || true
  echo "terminated $VERIFY_TROVE_BUNDLE_ID on $UDID"
else
  echo "simulator not booted or udid unknown — skip terminate"
fi

if [[ -f "$LAUNCH_JSON" ]]; then
  STARTED_METRO="$(python3 -c "import json;print(json.load(open('$LAUNCH_JSON')).get('started_metro',0))" 2>/dev/null || echo 0)"

  if [[ "$STARTED_METRO" == "1" || "$STARTED_METRO" == "True" ]]; then
    if [[ "${VERIFY_TROVE_KEEP_METRO:-0}" == "1" ]]; then
      echo "VERIFY_TROVE_KEEP_METRO=1 — leaving stim Metro running"
    else
      echo "stopping stim workspace started by this run (stim stop)"
      (
        cd "$MOBILE_APP"
        # stim stop shuts down the owned simulator by default for local devices.
        # Prefer leaving the stim-owned sim booted unless asked to shut down.
        if [[ "${VERIFY_TROVE_SHUTDOWN_SIM:-0}" == "1" ]]; then
          stim stop || true
        else
          # Stop Metro/supervisor without requiring sim shutdown: terminate app only above.
          # If stim stop is the only supported teardown for Metro we started, invoke it
          # only when shutdown is requested; otherwise leave Metro for reuse.
          echo "Metro was started by this run but VERIFY_TROVE_SHUTDOWN_SIM!=1 — leaving stim running for reuse"
          echo "Set VERIFY_TROVE_SHUTDOWN_SIM=1 to stim stop (stops Metro + owned sim)."
        fi
      )
    fi
  else
    echo "Metro was pre-existing — left running"
  fi
else
  echo "no launch.json — only closed session / terminated app if possible"
fi

if [[ ! -d "$VERIFY_TROVE_ARTIFACTS" ]]; then
  echo "ERROR: evidence directory missing after cleanup: $VERIFY_TROVE_ARTIFACTS" >&2
  exit 1
fi
echo "cleanup: done; evidence still at $VERIFY_TROVE_ARTIFACTS"
ls -la "$VERIFY_TROVE_ARTIFACTS" | head -40
