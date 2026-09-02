#!/usr/bin/env bash
# Tear down processes this verification run started. Never deletes evidence.
set -euo pipefail
# shellcheck source=lib.sh
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

LAUNCH_JSON="$VERIFY_TROVE_ARTIFACTS/launch.json"

echo "verify-trove cleanup"
echo "  artifacts=$VERIFY_TROVE_ARTIFACTS (retained)"

# Terminate the app on the verify UDID without killing by process name.
if xcrun simctl list devices | rg -q "${VERIFY_TROVE_UDID}.*Booted"; then
  xcrun simctl terminate "$VERIFY_TROVE_UDID" "$VERIFY_TROVE_BUNDLE_ID" 2>/dev/null || true
  echo "terminated $VERIFY_TROVE_BUNDLE_ID on $VERIFY_TROVE_UDID"
else
  echo "simulator not booted — skip terminate"
fi

if [[ -f "$LAUNCH_JSON" ]]; then
  STARTED_METRO="$(python3 -c "import json;print(json.load(open('$LAUNCH_JSON')).get('started_metro',0))" 2>/dev/null || echo 0)"
  METRO_PID="$(python3 -c "import json;print(json.load(open('$LAUNCH_JSON')).get('metro_pid') or '')" 2>/dev/null || true)"
  BOOTED_SIM="$(python3 -c "import json;print(json.load(open('$LAUNCH_JSON')).get('booted_sim',0))" 2>/dev/null || echo 0)"

  if [[ "$STARTED_METRO" == "1" || "$STARTED_METRO" == "True" ]]; then
    echo "stopping Metro started by this run"
    argent_run stop-metro 2>/dev/null || true
    if [[ -n "${METRO_PID}" && "${METRO_PID}" != "null" && "${METRO_PID}" != "None" ]]; then
      kill "$METRO_PID" 2>/dev/null || true
    fi
  else
    echo "Metro was pre-existing — left running"
  fi

  if [[ "${VERIFY_TROVE_SHUTDOWN_SIM:-0}" == "1" && ( "$BOOTED_SIM" == "1" || "$BOOTED_SIM" == "True" ) ]]; then
    echo "shutting down simulator $VERIFY_TROVE_UDID (VERIFY_TROVE_SHUTDOWN_SIM=1)"
    xcrun simctl shutdown "$VERIFY_TROVE_UDID" 2>/dev/null || true
  fi
else
  echo "no launch.json — only terminated app if booted; Metro/sim left alone"
fi

# Proof must survive.
if [[ ! -d "$VERIFY_TROVE_ARTIFACTS" ]]; then
  echo "ERROR: evidence directory missing after cleanup: $VERIFY_TROVE_ARTIFACTS" >&2
  exit 1
fi
echo "cleanup: done; evidence still at $VERIFY_TROVE_ARTIFACTS"
ls -la "$VERIFY_TROVE_ARTIFACTS" | head -40
