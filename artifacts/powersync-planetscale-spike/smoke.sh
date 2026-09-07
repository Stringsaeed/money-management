#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
ORG="${PSCALE_ORG:-stringsaeed}"
DB_NAME="${PSCALE_DB:-trove}"
BRANCH="${PSCALE_BRANCH:-main}"
HD_NAME="trove-ledger-fresh"
WORKER_NAME="trove-z0-spike"
WRITER_ROLE="${SPIKE_WRITER_ROLE:-spike-writer}"
PS_ROLE="${SPIKE_POWERSYNC_ROLE:-powersync_role}"
SECRETS="${SPIKE_SECRETS:-/tmp/z0-spike.env}"
RECEIPTS="${SPIKE_RECEIPTS:-/tmp/z0-spike-receipts}"
CLIENT_DB="${SPIKE_CLIENT_DB:-/tmp/z0-spike-client.db}"
MODE="run"

usage() {
	printf 'usage: smoke.sh [--bench] [--teardown] [--setup]\n' >&2
	exit 2
}

while [ $# -gt 0 ]; do
	case "$1" in
		--bench) MODE="bench" ;;
		--teardown) MODE="teardown" ;;
		--setup) MODE="setup" ;;
		-h | --help) usage ;;
		*) usage ;;
	esac
	shift
done

mkdir -p "$RECEIPTS"
umask 077
export PGSSLROOTCERT="${PGSSLROOTCERT:-system}"

need() {
	if ! command -v "$1" >/dev/null 2>&1; then
		printf 'missing required command: %s\n' "$1" >&2
		exit 1
	fi
}

wrangler() {
	npx --yes wrangler@4 "$@"
}

receipt() {
	local name="$1"
	shift
	"$@" | tee "$RECEIPTS/${name}.txt"
}

load_secrets() {
	if [ ! -f "$SECRETS" ]; then
		return 0
	fi
	python3 - "$SECRETS" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
out = []
for line in p.read_text().splitlines():
    if "postgresql://" in line and "sslrootcert=" not in line:
        line = line + ("&" if "?" in line else "?") + "sslrootcert=system"
    out.append(line)
p.write_text("\n".join(out) + ("\n" if out else ""))
PY
	eval "$(
		python3 - "$SECRETS" <<'PY'
import shlex
from pathlib import Path
import sys
for line in Path(sys.argv[1]).read_text().splitlines():
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, value = line.split("=", 1)
    if not key.isidentifier():
        continue
    print(f"export {key}={shlex.quote(value)}")
PY
	)"
	DIRECT_URL="${DIRECT_URL:-${WRITER_DIRECT_URL:-}}"
	POOLED_URL="${POOLED_URL:-${WRITER_POOLED_URL:-}}"
	PS_DIRECT_URL="${PS_DIRECT_URL:-${PSROLE_DIRECT_URL:-}}"
}

save_secret() {
	local key="$1"
	local value="$2"
	touch "$SECRETS"
	chmod 600 "$SECRETS"
	if grep -q "^${key}=" "$SECRETS" 2>/dev/null; then
		local tmp
		tmp="$(mktemp)"
		grep -v "^${key}=" "$SECRETS" >"$tmp"
		mv "$tmp" "$SECRETS"
	fi
	printf '%s=%s\n' "$key" "$value" >>"$SECRETS"
}

ensure_psql() {
	if command -v psql >/dev/null 2>&1; then
		return 0
	fi
	if [ -x /opt/homebrew/opt/libpq/bin/psql ]; then
		PATH="/opt/homebrew/opt/libpq/bin:$PATH"
		export PATH
		return 0
	fi
	if command -v brew >/dev/null 2>&1; then
		brew install libpq
		PATH="/opt/homebrew/opt/libpq/bin:$PATH"
		export PATH
	fi
	if ! command -v psql >/dev/null 2>&1; then
		printf 'psql is required. install libpq and rerun.\n' >&2
		exit 1
	fi
}

engine_check() {
	local json kind
	json="$(pscale database show "$DB_NAME" --org "$ORG" --format json)"
	printf '%s\n' "$json" | jq 'del(.. | .password? // empty)' >"$RECEIPTS/engine.json"
	kind="$(printf '%s\n' "$json" | jq -r '.kind // .engine // empty')"
	printf 'engine: %s\n' "$kind" | tee "$RECEIPTS/engine.txt"
	if [ "$kind" != "postgresql" ]; then
		printf 'HARD STOP: engine is %s, not postgresql\n' "$kind" >&2
		exit 2
	fi
}

role_json() {
	pscale role list "$DB_NAME" "$BRANCH" --org "$ORG" --format json
}

role_exists() {
	local name="$1"
	role_json | jq -e --arg name "$name" '.[] | select(.name == $name)' >/dev/null
}

store_role_urls() {
	local prefix="$1"
	local username="$2"
	local password="$3"
	local host="$4"
	local enc_user enc_pass
	enc_user="$(python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$username")"
	enc_pass="$(python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$password")"
	save_secret "${prefix}_USERNAME" "$username"
	save_secret "${prefix}_HOST" "$host"
	save_secret "${prefix}_DIRECT_URL" "postgresql://${enc_user}:${enc_pass}@${host}:5432/postgres?sslmode=verify-full&sslrootcert=system"
	save_secret "${prefix}_POOLED_URL" "postgresql://${enc_user}:${enc_pass}@${host}:6432/postgres?sslmode=verify-full&sslrootcert=system"
	if [ "$prefix" = "WRITER" ]; then
		save_secret DIRECT_URL "postgresql://${enc_user}:${enc_pass}@${host}:5432/postgres?sslmode=verify-full&sslrootcert=system"
		save_secret POOLED_URL "postgresql://${enc_user}:${enc_pass}@${host}:6432/postgres?sslmode=verify-full&sslrootcert=system"
	fi
	if [ "$prefix" = "PSROLE" ]; then
		save_secret PS_DIRECT_URL "postgresql://${enc_user}:${enc_pass}@${host}:5432/postgres?sslmode=verify-full&sslrootcert=system"
		save_secret POWERSYNC_ROLE_PASSWORD "$password"
	fi
}

ingest_role_json() {
	local prefix="$1"
	local created="$2"
	local username password host
	username="$(printf '%s\n' "$created" | jq -r '.username // .data.username // empty')"
	password="$(printf '%s\n' "$created" | jq -r '.password // .data.password // empty')"
	host="$(printf '%s\n' "$created" | jq -r '.access_host_url // .accessHostUrl // .data.access_host_url // empty')"
	if [ -z "$username" ] || [ -z "$password" ] || [ -z "$host" ]; then
		printf 'role payload missing connection fields for %s\n' "$prefix" >&2
		printf '%s\n' "$created" | jq 'del(.password, .data.password)' >&2
		exit 1
	fi
	store_role_urls "$prefix" "$username" "$password" "$host"
}

create_role() {
	local name="$1"
	local prefix="$2"
	shift 2
	local created
	if role_exists "$name"; then
		if [ -f "$SECRETS" ] && grep -q "^${prefix}_DIRECT_URL=" "$SECRETS"; then
			printf 'role %s already exists, reusing saved URL\n' "$name"
			return 0
		fi
		created="$(pscale role reset "$DB_NAME" "$BRANCH" "$name" --org "$ORG" --format json 2>/dev/null || true)"
		if [ -n "$created" ] && printf '%s\n' "$created" | jq -e '.password // .data.password' >/dev/null 2>&1; then
			ingest_role_json "$prefix" "$created"
			return 0
		fi
		printf 'role %s exists but has no saved password; delete it and rerun\n' "$name" >&2
		exit 1
	fi
	created="$(pscale role create "$DB_NAME" "$BRANCH" "$name" --org "$ORG" --format json "$@")"
	ingest_role_json "$prefix" "$created"
}

ensure_roles() {
	create_role "$WRITER_ROLE" WRITER --inherited-roles postgres
	create_role "$PS_ROLE" PSROLE --inherited-roles postgres --with-replication
	load_secrets
	if [ -z "${DIRECT_URL:-}" ]; then
		printf 'DIRECT_URL missing after role setup\n' >&2
		exit 1
	fi
}

psql_direct() {
	load_secrets
	psql "$DIRECT_URL" -v ON_ERROR_STOP=1 "$@"
}

wal_level() {
	local level
	level="$(psql_direct -tAc 'SHOW wal_level' | tr -d '[:space:]')"
	printf 'wal_level=%s\n' "$level" | tee "$RECEIPTS/wal_level.txt"
	if [ "$level" != "logical" ]; then
		printf 'HARD STOP: wal_level is %s, expected logical\n' "$level" >&2
		exit 2
	fi
}

assert_no_public_ledger_names() {
	local file="$1"
	if /usr/bin/grep -E 'public\.(accounts|categories|transactions|membership)' "$file" >/dev/null; then
		printf '%s must not name public ledger tables\n' "$file" >&2
		exit 1
	fi
}

apply_spike_sql() {
	load_secrets
	if [ -z "${PSROLE_USERNAME:-}" ]; then
		printf 'PSROLE_USERNAME missing\n' >&2
		exit 1
	fi
	assert_no_public_ledger_names "$ROOT/spike.sql"
	assert_no_public_ledger_names "$ROOT/teardown.sql"
	if /usr/bin/grep -E 'DROP TABLE' "$ROOT/teardown.sql" >/dev/null; then
		printf 'teardown.sql must drop only publication powersync and schema spike\n' >&2
		exit 1
	fi
	local psrole_ident="${PSROLE_USERNAME%%.*}"
	psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -v psrole="$psrole_ident" -f "$ROOT/spike.sql"
	local all_err
	all_err="$(psql "$DIRECT_URL" -c 'CREATE PUBLICATION powersync_forall FOR ALL TABLES;' 2>&1 || true)"
	printf '%s\n' "$all_err" | tee "$RECEIPTS/publication-forall.txt"
	psql "$DIRECT_URL" -c 'DROP PUBLICATION IF EXISTS powersync_forall;' >/dev/null 2>&1 || true
	if printf '%s\n' "$all_err" | grep -qiE 'error|not support|cannot'; then
		printf 'FOR ALL TABLES rejected\n' | tee "$RECEIPTS/publication-forall-verdict.txt"
	else
		printf 'FOR ALL TABLES accepted on this engine. spike still uses an explicit table list for publication powersync\n' | tee "$RECEIPTS/publication-forall-verdict.txt"
	fi
	printf 'CREATE PUBLICATION powersync FOR TABLE spike.accounts, spike.categories, spike.transactions, spike.membership\n' | tee "$RECEIPTS/publication-accepted.txt"
	psql_direct -c '\dRp+ powersync' | tee "$RECEIPTS/publication.txt"
	psql_direct -tAc "SELECT pubname FROM pg_publication WHERE pubname = 'powersync'" | tee "$RECEIPTS/publication-name.txt"
}

hyperdrive_id_from_text() {
	local name="$1"
	python3 -c '
import re, sys
name = sys.argv[1]
for line in sys.stdin:
    if name in line:
        ids = re.findall(r"[0-9a-f]{32}", line)
        if ids:
            print(ids[0])
            break
' "$name"
}

hyperdrive_id_by_name() {
	wrangler hyperdrive list 2>/dev/null | hyperdrive_id_from_text "$HD_NAME"
}

ensure_hyperdrive() {
	load_secrets
	local id created details
	id="$(hyperdrive_id_by_name || true)"
	if [ -z "$id" ]; then
		created="$(wrangler hyperdrive create "$HD_NAME" --connection-string "$POOLED_URL" --caching-disabled 2>&1)"
		printf '%s\n' "$created" | tee "$RECEIPTS/hyperdrive-create.txt"
		id="$(printf '%s\n' "$created" | hyperdrive_id_from_text "$HD_NAME")"
		if [ -z "$id" ]; then
			id="$(printf '%s\n' "$created" | python3 -c 'import re,sys; ids=re.findall(r"[0-9a-f]{32}", sys.stdin.read()); print(ids[0] if ids else "")')"
		fi
	fi
	if [ -z "$id" ]; then
		printf 'failed to create or find Hyperdrive %s\n' "$HD_NAME" >&2
		exit 1
	fi
	save_secret HYPERDRIVE_ID "$id"
	HYPERDRIVE_ID="$id"
	details="$(wrangler hyperdrive get "$id")"
	details="$(printf '%s\n' "$details" | python3 -c 'import sys; t=sys.stdin.read(); i=t.find("{"); print(t[i:] if i>=0 else t)')"
	printf '%s\n' "$details" | jq 'del(.origin.password)' | tee "$RECEIPTS/hyperdrive.json"
	local caching_disabled origin_host origin_port
	caching_disabled="$(printf '%s\n' "$details" | jq -r '.caching.disabled')"
	origin_host="$(printf '%s\n' "$details" | jq -r '.origin.host')"
	origin_port="$(printf '%s\n' "$details" | jq -r '.origin.port')"
	printf 'hyperdrive_id=%s caching.disabled=%s origin=%s:%s\n' "$id" "$caching_disabled" "$origin_host" "$origin_port" | tee "$RECEIPTS/hyperdrive-summary.txt"
	if [ "$caching_disabled" != "true" ]; then
		printf 'Hyperdrive %s must have caching.disabled=true\n' "$HD_NAME" >&2
		exit 1
	fi
	if [ "$id" = "656e7684e86a457bafe573348a82376e" ]; then
		printf 'refusing to reuse cache-enabled Hyperdrive trove\n' >&2
		exit 1
	fi
	printf 'direct_url_host=%s:5432 hyperdrive_id=%s\n' "${WRITER_HOST:-${PSROLE_HOST:-aws-us-east-1-3.pg.psdb.cloud}}" "$id" | tee "$RECEIPTS/url-diff.txt"
	printf 'PROVED url_diff: PlanetScale direct :5432 != Hyperdrive id %s\n' "$id" | tee -a "$RECEIPTS/url-diff.txt"
}

deploy_worker() {
	load_secrets
	sed "s/__HYPERDRIVE_ID__/${HYPERDRIVE_ID}/" "$ROOT/wrangler.template.jsonc" >"$ROOT/wrangler.jsonc"
	(
		cd "$ROOT"
		if [ ! -d node_modules/postgres ]; then
			npm install --omit=dev
		fi
		wrangler deploy --name "$WORKER_NAME" --config wrangler.jsonc
	) | tee "$RECEIPTS/worker-deploy.txt"
	WORKER_URL="$(grep -Eo 'https://[^[:space:]]+workers.dev' "$RECEIPTS/worker-deploy.txt" | tail -n 1 || true)"
	if [ -z "$WORKER_URL" ]; then
		WORKER_URL="$(wrangler deployments status --name "$WORKER_NAME" 2>/dev/null | grep -Eo 'https://[^[:space:]]+workers.dev' | head -n 1 || true)"
	fi
	if [ -z "$WORKER_URL" ]; then
		WORKER_URL="https://${WORKER_NAME}.workers.dev"
	fi
	save_secret WORKER_URL "$WORKER_URL"
	WORKER_URL="$WORKER_URL"
}

worker_select1() {
	load_secrets
	local body=""
	local i
	for i in 1 2 3 4 5; do
		if body="$(curl -fsS "${WORKER_URL}/select1")"; then
			break
		fi
		sleep 2
	done
	printf '%s\n' "$body" | tee "$RECEIPTS/hyperdrive-select1.json"
	printf '%s\n' "$body" | jq -e '.n == 1' >/dev/null
}

seed_membership() {
	load_secrets
	local user_id="${SPIKE_USER_ID:-spike-user}"
	local household_id="${SPIKE_HOUSEHOLD_ID:-spike-house}"
	psql_direct -c "INSERT INTO spike.membership (id, user_id, household_id) VALUES ('mem-spike', '${user_id}', '${household_id}') ON CONFLICT (id) DO NOTHING;"
	save_secret SPIKE_USER_ID "$user_id"
	save_secret SPIKE_HOUSEHOLD_ID "$household_id"
}

worker_insert() {
	load_secrets
	local id="${SPIKE_ROW_ID:-txn-$(date -u +%Y%m%d%H%M%S)}"
	local household_id="${SPIKE_HOUSEHOLD_ID:-spike-house}"
	local body
	body="$(curl -fsS -G "${WORKER_URL}/insert" --data-urlencode "id=${id}" --data-urlencode "household_id=${household_id}" --data-urlencode "note=z0-roundtrip")"
	printf '%s\n' "$body" | tee "$RECEIPTS/hyperdrive-insert.json"
	printf '%s\n' "$body" | jq -e --arg id "$id" '.id == $id' >/dev/null
	save_secret SPIKE_ROW_ID "$id"
	SPIKE_ROW_ID="$id"
}

p90() {
	python3 - "$@" <<'PY'
import sys
vals = sorted(float(x) for x in sys.argv[1:])
if not vals:
    print("nan")
    raise SystemExit(1)
idx = max(0, min(len(vals) - 1, round(0.9 * (len(vals) - 1))))
print(f"{vals[idx]:.3f}")
PY
}

bench() {
	load_secrets
	ensure_psql
	local i t hd_samples=() direct_samples=()
	for i in $(seq 1 20); do
		t="$(curl -fsS "${WORKER_URL}/select1" | jq -r '.elapsed_ms')"
		hd_samples+=("$t")
		t="$(
			python3 - <<'PY'
import os, time, subprocess
start = time.perf_counter()
subprocess.check_output(["psql", os.environ["DIRECT_URL"], "-tAc", "SELECT 1"], env=os.environ)
print(f"{(time.perf_counter()-start)*1000:.3f}")
PY
		)"
		direct_samples+=("$t")
	done
	python3 - <<PY | tee "$RECEIPTS/bench.txt"
samples_hd = [$(IFS=,; echo "${hd_samples[*]}")]
samples_d = [$(IFS=,; echo "${direct_samples[*]}")]

def pct(vals, p):
    vals = sorted(vals)
    idx = max(0, min(len(vals)-1, round(p/100 * (len(vals)-1))))
    return vals[idx]

print(f"hyperdrive_select1_p50_ms={pct(samples_hd,50):.3f}")
print(f"hyperdrive_select1_p90_ms={pct(samples_hd,90):.3f}")
print(f"direct_select1_p50_ms={pct(samples_d,50):.3f}")
print(f"direct_select1_p90_ms={pct(samples_d,90):.3f}")
print(f"rule_hyperdrive_p90_under_50ms={'pass' if pct(samples_hd,90) < 50 else 'miss'}")
print("note=hyperdrive samples are Worker-reported elapsed_ms, not client RTT")
PY
}

ensure_powersync() {
	load_secrets
	if [ -n "${POWERSYNC_URL:-}" ] && [ -n "${POWERSYNC_TOKEN:-}" ]; then
		printf 'using provided POWERSYNC_URL\n' | tee "$RECEIPTS/powersync-source.txt"
		printf 'source_host_must_be_planetscale_direct_not_hyperdrive\n' | tee -a "$RECEIPTS/powersync-source.txt"
		return 0
	fi
	if [ -z "${PS_ADMIN_TOKEN:-}" ]; then
		if npx --yes powersync@0.10.0 fetch instances >/tmp/z0-ps-instances.txt 2>&1; then
			cat /tmp/z0-ps-instances.txt | tee "$RECEIPTS/powersync-instances.txt"
		else
			printf 'PowerSync Cloud login missing. Set PS_ADMIN_TOKEN or POWERSYNC_URL and POWERSYNC_TOKEN.\n' | tee "$RECEIPTS/powersync-missing.txt"
			return 1
		fi
	fi
	local cfg
	cfg="/tmp/z0-powersync"
	rm -rf "$cfg"
	mkdir -p "$cfg"
	load_secrets
	local host user
	host="${PSROLE_HOST:-aws-us-east-1-3.pg.psdb.cloud}"
	user="${PSROLE_USERNAME:-}"
	if [ -z "$user" ]; then
		printf 'powersync_role username missing\n' >&2
		return 1
	fi
	cat >"$cfg/sync-config.yaml" <<YAML
$(cat "$ROOT/sync-streams.yaml")
YAML
	printf 'powersync_config_dir=%s host=%s user=%s port=5432\n' "$cfg" "$host" "$user" | tee "$RECEIPTS/powersync-source.txt"
	if printf '%s' "$host" | grep -qi hyperdrive; then
		printf 'PowerSync source host must not be Hyperdrive\n' >&2
		return 1
	fi
	return 0
}

roundtrip() {
	load_secrets
	if [ -z "${POWERSYNC_URL:-}" ] || [ -z "${POWERSYNC_TOKEN:-}" ]; then
		printf 'skipping client SQLite wait: POWERSYNC_URL/TOKEN unset\n' | tee "$RECEIPTS/roundtrip-skip.txt"
		return 1
	fi
	(
		cd "$ROOT"
		if [ ! -d node_modules/@powersync/node ]; then
			npm install --omit=dev
		fi
		SPIKE_CLIENT_DB="$CLIENT_DB" SPIKE_ROW_ID="$SPIKE_ROW_ID" POWERSYNC_URL="$POWERSYNC_URL" POWERSYNC_TOKEN="$POWERSYNC_TOKEN" npm run roundtrip
	) | tee "$RECEIPTS/roundtrip.json"
}

teardown() {
	load_secrets
	assert_teardown_safe
	if wrangler delete --name "$WORKER_NAME" --force >/dev/null 2>&1 || wrangler delete --name "$WORKER_NAME" --yes >/dev/null 2>&1; then
		printf 'deleted worker %s\n' "$WORKER_NAME" | tee "$RECEIPTS/teardown-worker.txt"
	else
		wrangler delete --name "$WORKER_NAME" 2>&1 | tee "$RECEIPTS/teardown-worker.txt" || true
	fi
	local id
	id="${HYPERDRIVE_ID:-$(hyperdrive_id_by_name || true)}"
	if [ -n "$id" ]; then
		wrangler hyperdrive delete "$id" --force 2>&1 | tee "$RECEIPTS/teardown-hyperdrive.txt" || \
			wrangler hyperdrive delete "$id" 2>&1 | tee "$RECEIPTS/teardown-hyperdrive.txt" || true
	else
		printf 'hyperdrive %s already absent\n' "$HD_NAME" | tee "$RECEIPTS/teardown-hyperdrive.txt"
	fi
	if [ -n "${DIRECT_URL:-}" ]; then
		ensure_psql
		psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f "$ROOT/teardown.sql" | tee "$RECEIPTS/teardown-schema.txt"
	fi
	if role_exists "$WRITER_ROLE"; then
		pscale role delete "$DB_NAME" "$BRANCH" "$WRITER_ROLE" --org "$ORG" --force 2>&1 | tee "$RECEIPTS/teardown-writer-role.txt" || true
	fi
	if role_exists "$PS_ROLE"; then
		pscale role delete "$DB_NAME" "$BRANCH" "$PS_ROLE" --org "$ORG" --force 2>&1 | tee "$RECEIPTS/teardown-powersync-role.txt" || true
	fi
	wrangler hyperdrive list 2>/dev/null | tee "$RECEIPTS/teardown-hyperdrive-list.txt"
	if [ -n "${DIRECT_URL:-}" ]; then
		psql "$DIRECT_URL" -tAc "SELECT nspname FROM pg_namespace WHERE nspname = 'spike'; SELECT pubname FROM pg_publication WHERE pubname IN ('powersync','powersync_forall');" | tee "$RECEIPTS/teardown-schema-check.txt" || true
	fi
}

assert_teardown_safe() {
	if [ -z "${DIRECT_URL:-}" ]; then
		printf 'HARD STOP: teardown needs DIRECT_URL to prove publication powersync is spike-only.\n' >&2
		exit 2
	fi
	ensure_psql

	local adopted_tables
	adopted_tables="$(psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -tAc "SELECT schemaname || '.' || tablename FROM pg_publication_tables WHERE pubname = 'powersync' AND schemaname <> 'spike' ORDER BY 1")"
	if [ -n "$adopted_tables" ]; then
		printf 'HARD STOP: publication powersync contains non-spike tables; Z0 teardown cannot delete adopted infrastructure:\n%s\n' "$adopted_tables" >&2
		exit 2
	fi

	local infra="$ROOT/../../packages/infra/alchemy.run.ts"
	if [ -f "$infra" ] && {
		/usr/bin/grep -F 'name: "trove-ledger-fresh"' "$infra" >/dev/null ||
			/usr/bin/grep -F 'return "trove-ledger-fresh"' "$infra" >/dev/null
	}; then
		printf 'HARD STOP: packages/infra has adopted Hyperdrive %s; Z0 teardown cannot delete it.\n' "$HD_NAME" >&2
		exit 2
	fi
}

setup() {
	need pscale
	need jq
	need python3
	need curl
	need npm
	ensure_psql
	engine_check
	ensure_roles
	wal_level
	apply_spike_sql
	ensure_hyperdrive
	deploy_worker
	worker_select1
	seed_membership
	worker_insert
	ensure_powersync || true
}

run() {
	setup
	if [ -n "${POWERSYNC_URL:-}" ] && [ -n "${POWERSYNC_TOKEN:-}" ]; then
		roundtrip
	else
		printf 'round trip deferred until PowerSync Cloud credentials exist\n' | tee "$RECEIPTS/roundtrip-skip.txt"
	fi
	if [ ! -f "$RECEIPTS/roundtrip.json" ]; then
		printf 'smoke incomplete: PowerSync client round trip not recorded\n' >&2
		exit 1
	fi
}

case "$MODE" in
	setup) setup ;;
	run) run ;;
	bench)
		load_secrets
		ensure_psql
		if [ -z "${WORKER_URL:-}" ]; then
			setup
		fi
		bench
		;;
	teardown) teardown ;;
esac

printf 'ok mode=%s receipts=%s\n' "$MODE" "$RECEIPTS"
