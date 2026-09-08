#!/usr/bin/env bash
# Boot stim-owned simulator, start Metro, install/launch Trove for verification.
set -euo pipefail
# shellcheck source=lib.sh
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

require_cmd stim
require_cmd agent-device
require_cmd python3

STARTED_METRO=0
STARTED_IOS=0

echo "verify-trove launch (stim + agent-device)"
echo "  mobile=$MOBILE_APP"
echo "  artifacts=$VERIFY_TROVE_ARTIFACTS"

cd "$MOBILE_APP"

echo "stim start --json"
START_JSON="$(stim start --json 2>"$VERIFY_TROVE_ARTIFACTS/stim-start.stderr.log")"
printf '%s\n' "$START_JSON" | tee "$VERIFY_TROVE_ARTIFACTS/stim-start.json"
ALREADY_RUNNING="$(python3 -c "import json,sys;print(json.load(sys.stdin).get('alreadyRunning',False))" <<<"$START_JSON")"
METRO_PORT="$(python3 -c "import json,sys;print(json.load(sys.stdin).get('port') or 8081)" <<<"$START_JSON")"
if [[ "$ALREADY_RUNNING" == "False" || "$ALREADY_RUNNING" == "false" ]]; then
  STARTED_METRO=1
fi
VERIFY_TROVE_METRO_PORT="$METRO_PORT"
export VERIFY_TROVE_METRO_PORT

IOS_ARGS=(ios --json)
if [[ "${VERIFY_TROVE_FORCE_BUILD:-0}" == "1" ]]; then
  IOS_ARGS+=(--no-build-cache)
  echo "VERIFY_TROVE_FORCE_BUILD=1 — stim ios --no-build-cache"
fi

echo "stim ${IOS_ARGS[*]}"
# Native builds can outlive a short shell block; allow a long wait.
IOS_JSON="$(stim "${IOS_ARGS[@]}" 2>"$VERIFY_TROVE_ARTIFACTS/stim-ios.stderr.log")"
printf '%s\n' "$IOS_JSON" | tee "$VERIFY_TROVE_ARTIFACTS/stim-ios.json"
STARTED_IOS=1

UDID="$(python3 -c "import json,sys;print(json.load(sys.stdin)['udid'])" <<<"$IOS_JSON")"
BUNDLE_ID="$(python3 -c "import json,sys;print(json.load(sys.stdin).get('bundleId') or '')" <<<"$IOS_JSON")"
LAUNCHED="$(python3 -c "import json,sys;print(json.load(sys.stdin).get('launched'))" <<<"$IOS_JSON")"
METRO_PORT="$(python3 -c "import json,sys;print(json.load(sys.stdin).get('metroPort') or $METRO_PORT)" <<<"$IOS_JSON")"
DEVICE_NAME="$(python3 -c "import json,sys;print(json.load(sys.stdin).get('deviceName') or '')" <<<"$IOS_JSON")"

VERIFY_TROVE_UDID="$UDID"
VERIFY_TROVE_METRO_PORT="$METRO_PORT"
export VERIFY_TROVE_UDID VERIFY_TROVE_METRO_PORT

if [[ -n "$BUNDLE_ID" && "$BUNDLE_ID" != "$VERIFY_TROVE_BUNDLE_ID" ]]; then
  echo "WARN: stim reported bundleId=$BUNDLE_ID (expected $VERIFY_TROVE_BUNDLE_ID)" >&2
fi

echo "waiting for Trove JS chrome via agent-device (launched=$LAUNCHED)"
agent_device open "$VERIFY_TROVE_BUNDLE_ID" \
  --platform ios \
  --udid "$UDID" \
  --session "$VERIFY_TROVE_SESSION" \
  --metro-host 127.0.0.1 \
  --metro-port "$METRO_PORT" \
  --launch-url "trove://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A${METRO_PORT}" \
  --relaunch \
  >"$VERIFY_TROVE_ARTIFACTS/agent-device-open.txt" 2>&1 || true

# System alert "Open in Trove (Dev)?" appears for custom-scheme deep links.
agent_device alert accept --session "$VERIFY_TROVE_SESSION" \
  >"$VERIFY_TROVE_ARTIFACTS/agent-device-alert.txt" 2>&1 || true

CHROME_OK=0
for _ in $(seq 1 60); do
  SNAP="$(agent_device snapshot -i --session "$VERIFY_TROVE_SESSION" 2>/dev/null || true)"
  printf '%s\n' "$SNAP" >"$VERIFY_TROVE_ARTIFACTS/launch-snapshot.txt"
  if printf '%s' "$SNAP" | rg -qi 'Open in .Trove|Open in “Trove'; then
    agent_device alert accept --session "$VERIFY_TROVE_SESSION" >/dev/null 2>&1 \
      || agent_device press 'label="Open"' --settle --session "$VERIFY_TROVE_SESSION" >/dev/null 2>&1 \
      || true
    sleep 2
    continue
  fi
  if printf '%s' "$SNAP" | rg -qi 'Searching for development servers|DEVELOPMENT SERVERS|Enter URL manually|Expo Go|incompatible with this version'; then
    # Prefer the workspace Metro row, then fall back to launch-url reopen.
    if printf '%s' "$SNAP" | rg -q "127.0.0.1:${METRO_PORT}|localhost:${METRO_PORT}|192\\.[0-9.]*:${METRO_PORT}"; then
      agent_device press "text=\"Trove (Dev), http://127.0.0.1:${METRO_PORT}\"" --settle --session "$VERIFY_TROVE_SESSION" >/dev/null 2>&1 \
        || agent_device press "@e13" --settle --session "$VERIFY_TROVE_SESSION" >/dev/null 2>&1 \
        || true
    fi
    agent_device open "$VERIFY_TROVE_BUNDLE_ID" \
      --platform ios \
      --udid "$UDID" \
      --session "$VERIFY_TROVE_SESSION" \
      --metro-host 127.0.0.1 \
      --metro-port "$METRO_PORT" \
      --launch-url "trove://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A${METRO_PORT}" \
      --relaunch \
      >"$VERIFY_TROVE_ARTIFACTS/agent-device-reopen.txt" 2>&1 || true
    agent_device alert accept --session "$VERIFY_TROVE_SESSION" >/dev/null 2>&1 || true
    sleep 3
    continue
  fi
  if printf '%s' "$SNAP" | rg -qi 'Plant your first seed|Create transaction|Name your first plot|Open Trove|Erase local data from this device|Your garden is planted|No currency workspace yet|Set up Envelopes|Recent Journal'; then
    CHROME_OK=1
    echo "app chrome visible"
    break
  fi
  sleep 2
done

if [[ "$CHROME_OK" -ne 1 ]]; then
  echo "WARN: chrome not confirmed yet — run doctor.sh; see launch-snapshot.txt" >&2
fi

VERIFY_TROVE_UDID="$UDID" \
VERIFY_TROVE_METRO_PORT="$METRO_PORT" \
VERIFY_TROVE_DEVICE_NAME="$DEVICE_NAME" \
VERIFY_TROVE_STARTED_METRO="$STARTED_METRO" \
VERIFY_TROVE_STARTED_IOS="$STARTED_IOS" \
VERIFY_TROVE_STIM_LAUNCHED="$LAUNCHED" \
python3 - "$VERIFY_TROVE_ARTIFACTS/launch.json" <<'PY'
import json, os, sys

launched_raw = os.environ.get("VERIFY_TROVE_STIM_LAUNCHED", "")
if launched_raw in ("true", "True"):
    launched = True
elif launched_raw in ("false", "False"):
    launched = False
elif launched_raw == "":
    launched = None
else:
    launched = launched_raw

payload = {
    "run_id": os.environ["VERIFY_TROVE_RUN_ID"],
    "udid": os.environ["VERIFY_TROVE_UDID"],
    "device_name": os.environ.get("VERIFY_TROVE_DEVICE_NAME", ""),
    "bundle_id": os.environ["VERIFY_TROVE_BUNDLE_ID"],
    "metro_port": int(os.environ["VERIFY_TROVE_METRO_PORT"]),
    "started_metro": int(os.environ.get("VERIFY_TROVE_STARTED_METRO", "0")),
    "started_ios": int(os.environ.get("VERIFY_TROVE_STARTED_IOS", "0")),
    "stim_launched": launched,
    "session": os.environ["VERIFY_TROVE_SESSION"],
    "force_build": int(os.environ.get("VERIFY_TROVE_FORCE_BUILD", "0")),
    "harness": "stim+agent-device",
}
with open(sys.argv[1], "w", encoding="utf-8") as fh:
    json.dump(payload, fh, indent=2)
    fh.write("\n")
PY

echo "launch: ready"
echo "  udid=$UDID"
echo "  metro_port=$METRO_PORT"
echo "  artifacts=$VERIFY_TROVE_ARTIFACTS"
echo "next: .cursor/skills/verify-trove/scripts/doctor.sh"
