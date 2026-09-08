#!/usr/bin/env bash
# Run basic Maestro verification flows via agent-device against the stim-launched app.
# Uses one long-lived session + sequential `replay --maestro` so we do not fight a
# second daemon's iOS runner claim (agent-device test spawns an ephemeral daemon).
set -euo pipefail
# shellcheck source=lib.sh
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

require_cmd agent-device
require_cmd stim

FLOWS_DIR="$(cd "$(dirname "$0")/../flows" && pwd)"
UDID="$(resolve_udid)" || {
  echo "run launch.sh first (no udid)" >&2
  exit 1
}
METRO_PORT="$(resolve_metro_port)"
VERIFY_TROVE_UDID="$UDID"
VERIFY_TROVE_METRO_PORT="$METRO_PORT"
export VERIFY_TROVE_UDID VERIFY_TROVE_METRO_PORT

echo "verify-trove run-flows"
echo "  udid=$UDID"
echo "  metro_port=$METRO_PORT"
echo "  flows=$FLOWS_DIR"
echo "  artifacts=$VERIFY_TROVE_ARTIFACTS"

# Ensure doctor-green before mutating (doctor closes its probe session).
"$(cd "$(dirname "$0")" && pwd)/doctor.sh"

SUITE_DIR="$VERIFY_TROVE_ARTIFACTS/flows"
mkdir -p "$SUITE_DIR"
: >"$VERIFY_TROVE_ARTIFACTS/run-flows.log"

# Ordered basic suite: clear + onboard, then navigation / mutation features.
FLOW_LIST=(
  "$FLOWS_DIR/01-onboarding.yaml"
  "$FLOWS_DIR/02-tab-navigation.yaml"
  "$FLOWS_DIR/03-create-transaction.yaml"
  "$FLOWS_DIR/04-settings-accounts.yaml"
  "$FLOWS_DIR/05-envelopes.yaml"
)

# Bind one session to the stim UDID + Metro before the suite.
agent-device close --session "$VERIFY_TROVE_SESSION" >/dev/null 2>&1 || true
agent-device open "$VERIFY_TROVE_BUNDLE_ID" \
  --platform ios \
  --udid "$UDID" \
  --session "$VERIFY_TROVE_SESSION" \
  --metro-host 127.0.0.1 \
  --metro-port "$METRO_PORT" \
  --launch-url "trove://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A${METRO_PORT}" \
  --relaunch \
  >>"$VERIFY_TROVE_ARTIFACTS/run-flows.log" 2>&1 || true
agent-device alert accept --session "$VERIFY_TROVE_SESSION" >>"$VERIFY_TROVE_ARTIFACTS/run-flows.log" 2>&1 || true

fail=0
for flow in "${FLOW_LIST[@]}"; do
  name="$(basename "$flow")"
  echo "=== replay $name ===" | tee -a "$VERIFY_TROVE_ARTIFACTS/run-flows.log"
  if agent-device replay "$flow" \
    --maestro \
    --session "$VERIFY_TROVE_SESSION" \
    --metro-host 127.0.0.1 \
    --metro-port "$METRO_PORT" \
    --keep-session \
    >>"$VERIFY_TROVE_ARTIFACTS/run-flows.log" 2>&1; then
    echo "PASS: $name"
  else
    echo "FAIL: $name" >&2
    fail=1
    break
  fi
done

agent-device screenshot --session "$VERIFY_TROVE_SESSION" --out "$SUITE_DIR/suite-final.png" \
  >>"$VERIFY_TROVE_ARTIFACTS/run-flows.log" 2>&1 || true
agent-device close --session "$VERIFY_TROVE_SESSION" >>"$VERIFY_TROVE_ARTIFACTS/run-flows.log" 2>&1 || true

if [[ "$fail" -ne 0 ]]; then
  echo "run-flows: FAILED — see $VERIFY_TROVE_ARTIFACTS/run-flows.log" >&2
  exit 1
fi
echo "run-flows: done"
echo "  suite artifacts: $SUITE_DIR"
exit 0
