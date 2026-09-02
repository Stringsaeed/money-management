#!/usr/bin/env bash
# Boot simulator, ensure Metro (dev-client), install/launch Trove for verification.
set -euo pipefail
# shellcheck source=lib.sh
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

STARTED_METRO=0
BOOTED_SIM=0
METRO_PID=""
DEV_CLIENT_URL="trove://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081"

echo "verify-trove launch"
echo "  udid=$VERIFY_TROVE_UDID"
echo "  artifacts=$VERIFY_TROVE_ARTIFACTS"

if ! xcrun simctl list devices | rg -q "${VERIFY_TROVE_UDID}.*Booted"; then
  echo "booting simulator $VERIFY_TROVE_UDID"
  argent_run boot-device --udid "$VERIFY_TROVE_UDID"
  BOOTED_SIM=1
else
  echo "simulator already booted"
fi

wait_for_metro() {
  local i
  for i in $(seq 1 120); do
    if curl -sf "http://127.0.0.1:8081/status" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

if curl -sf "http://127.0.0.1:8081/status" >/dev/null 2>&1; then
  echo "Metro already healthy on :8081 — reusing"
else
  echo "ensuring workspace packages built"
  (
    cd "$ROOT"
    pnpm exec turbo run build --filter=mobile...
  ) >"$VERIFY_TROVE_ARTIFACTS/turbo-build.log" 2>&1

  echo "starting Metro (expo start --dev-client) via nohup"
  # Never use bare `exp://` — that opens Expo Go. This app requires the custom dev client.
  nohup bash -lc "cd \"$ROOT/apps/mobile\" && pnpm exec expo start --dev-client --port 8081" \
    >"$VERIFY_TROVE_ARTIFACTS/metro.log" 2>&1 &
  METRO_PID=$!
  disown "$METRO_PID" 2>/dev/null || true
  STARTED_METRO=1
  if ! wait_for_metro; then
    echo "Metro did not become healthy on :8081 — see $VERIFY_TROVE_ARTIFACTS/metro.log" >&2
    exit 1
  fi
  echo "Metro healthy (wrapper_pid=$METRO_PID)"
fi

APP_INSTALLED=0
if xcrun simctl get_app_container "$VERIFY_TROVE_UDID" "$VERIFY_TROVE_BUNDLE_ID" data >/dev/null 2>&1; then
  APP_INSTALLED=1
fi

if [[ "${VERIFY_TROVE_FORCE_BUILD:-0}" == "1" || "$APP_INSTALLED" -eq 0 ]]; then
  echo "building/installing app onto $VERIFY_TROVE_UDID (force=${VERIFY_TROVE_FORCE_BUILD:-0} installed=$APP_INSTALLED)"
  # EAS buildCacheProvider downloads fingerprint-matched remotes and ignores --no-build-cache.
  # Stash eas.json for this compile only so resolveBuildCache returns null (local Xcode build).
  EAS_JSON="$ROOT/apps/mobile/eas.json"
  EAS_BAK="$VERIFY_TROVE_ARTIFACTS/eas.json.verify-bak"
  RESTORED_EAS=0
  if [[ -f "$EAS_JSON" ]]; then
    cp "$EAS_JSON" "$EAS_BAK"
    mv "$EAS_JSON" "${EAS_JSON}.verify-stashed"
    echo "stashed apps/mobile/eas.json to force a local native compile"
  fi
  restore_eas() {
    if [[ -f "${EAS_JSON}.verify-stashed" ]]; then
      mv "${EAS_JSON}.verify-stashed" "$EAS_JSON"
      RESTORED_EAS=1
      echo "restored apps/mobile/eas.json"
    fi
  }
  trap restore_eas EXIT
  (
    cd "$ROOT/apps/mobile"
    pnpm exec expo run:ios --device "$VERIFY_TROVE_UDID" --no-build-cache --no-bundler
  ) 2>&1 | tee "$VERIFY_TROVE_ARTIFACTS/ios-build.log"
  restore_eas
  trap - EXIT
  argent_run open-url --udid "$VERIFY_TROVE_UDID" --url "$DEV_CLIENT_URL" >/dev/null 2>&1 || true
else
  echo "app installed — launch native client + open packager deep link"
  argent_run launch-app --udid "$VERIFY_TROVE_UDID" --bundleId "$VERIFY_TROVE_BUNDLE_ID"
  # Custom scheme deep link into the installed Trove (Dev) client — not Expo Go.
  argent_run open-url --udid "$VERIFY_TROVE_UDID" --url "$DEV_CLIENT_URL"
fi

echo "waiting for Trove JS app chrome (not Expo launcher / Expo Go)"
for _ in $(seq 1 90); do
  desc="$(argent_run describe --udid "$VERIFY_TROVE_UDID" --bundleId "$VERIFY_TROVE_BUNDLE_ID" 2>/dev/null || true)"
  if printf '%s' "$desc" | rg -qi 'Searching for development servers|DEVELOPMENT SERVERS|Enter URL manually|Expo Go|incompatible with this version'; then
    # Re-assert the deep link periodically while Metro finishes bundling.
    argent_run open-url --udid "$VERIFY_TROVE_UDID" --url "$DEV_CLIENT_URL" >/dev/null 2>&1 || true
    sleep 2
    continue
  fi
  if printf '%s' "$desc" | rg -qi 'Plant your first seed|Create transaction|Name your first plot|Open Trove|Erase All Data|Your garden is planted|Budget envelopes are coming soon'; then
    echo "app chrome visible"
    printf '%s\n' "$desc" >"$VERIFY_TROVE_ARTIFACTS/launch-describe.txt"
    break
  fi
  sleep 2
done

cat >"$VERIFY_TROVE_ARTIFACTS/launch.json" <<EOF
{
  "run_id": "$VERIFY_TROVE_RUN_ID",
  "udid": "$VERIFY_TROVE_UDID",
  "bundle_id": "$VERIFY_TROVE_BUNDLE_ID",
  "started_metro": $STARTED_METRO,
  "metro_pid": ${METRO_PID:-null},
  "booted_sim": $BOOTED_SIM,
  "force_build": ${VERIFY_TROVE_FORCE_BUILD:-0},
  "dev_client_url": "$DEV_CLIENT_URL"
}
EOF

echo "launch: ready (artifacts=$VERIFY_TROVE_ARTIFACTS)"
echo "next: .cursor/skills/verify-trove/scripts/doctor.sh"
