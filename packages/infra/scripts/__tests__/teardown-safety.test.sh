#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../powersync-z0" && pwd)"
scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT
mkdir -p "$scratch/bin" "$scratch/receipts"

cat >"$scratch/bin/psql" <<'SH'
#!/usr/bin/env bash
if [ "${STUB_PUBLICATION_MODE:-}" = "public" ]; then
  printf 'public.accounts\n'
fi
SH

cat >"$scratch/bin/npx" <<SH
#!/usr/bin/env bash
touch "$scratch/destructive-command-ran"
exit 1
SH

chmod +x "$scratch/bin/psql" "$scratch/bin/npx"

if PATH="$scratch/bin:$PATH" \
  STUB_PUBLICATION_MODE=public \
  DIRECT_URL=postgresql://guard.invalid/postgres \
  SPIKE_SECRETS="$scratch/missing.env" \
  SPIKE_RECEIPTS="$scratch/receipts" \
  bash "$root/smoke.sh" --teardown >"$scratch/output" 2>&1; then
  printf 'expected teardown to reject a publication containing public tables\n' >&2
  exit 1
fi

grep -F 'publication powersync contains non-spike tables' "$scratch/output" >/dev/null
if [ -e "$scratch/destructive-command-ran" ]; then
  printf 'teardown ran a destructive command before its publication guard\n' >&2
  exit 1
fi

if PATH="$scratch/bin:$PATH" \
  STUB_PUBLICATION_MODE=spike \
  DIRECT_URL=postgresql://guard.invalid/postgres \
  SPIKE_SECRETS="$scratch/missing.env" \
  SPIKE_RECEIPTS="$scratch/receipts" \
  bash "$root/smoke.sh" --teardown >"$scratch/output" 2>&1; then
  printf 'expected teardown to reject a Hyperdrive adopted by packages/infra\n' >&2
  exit 1
fi

grep -F 'packages/infra has adopted Hyperdrive trove-ledger-fresh' "$scratch/output" >/dev/null
if [ -e "$scratch/destructive-command-ran" ]; then
  printf 'teardown ran a destructive command before its Hyperdrive adoption guard\n' >&2
  exit 1
fi

grep -F "schemaname <> 'spike'" "$root/teardown.sql" >/dev/null
printf 'teardown safety checks passed\n'
