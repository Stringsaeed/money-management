# DDL credential probe + PlanetScale schema reconfirm (Relates #232)

**Stamped:** 2026-09-12T19:48Z (UTC)  
**Cert PR:** #241 tip parent `ad4a77e9`  
**Worktree:** `/tmp/wt-241-cert232-ddl` (root `/workspace` stayed on `main`)  
**Relates:** #232 only — does **not** close #232 / #224

## 1. Agent-env credential probe (no inventing)

Coordinator VM `os.environ` scan (35 keys total):

| Need | Status |
| --- | --- |
| `DATABASE_URL` / `PLANETSCALE_*` / `PG*` / owner DSN | **MISSING** |
| `WORKOS_WEBHOOK_SECRET` | **MISSING** |
| `CERT_USER_*` / cert tokens | **MISSING** |
| PowerSync mint (`POWERSYNC_*`) | **MISSING** |
| Local `.env` / `.env.local` under `/workspace` | **absent** |

`gh secret list` / `gh variable list` → HTTP **403** (integration cannot read secret names/values).

**HARD STOP (agent-env DDL path):** this environment has **no** table-owner connection string secrets to run migrations 0011–0015 via `psql`/ensure scripts. Secrets were **not** invented.

## 2. PlanetScale MCP capability (read)

PlanetScale MCP namespace **ready**. Read-only `planetscale_execute_read_query` works for `stringsaeed` / `trove` / `main` (primary, `use_replica=false`).

Write/DDL tool exists (`planetscale_execute_write_query`) but requires explicit human `confirm_destructive` for ALTER/DROP. **Not used this stamp** — schema already complete (below); re-applying 0011–0015 would be unnecessary destructive churn.

## 3. Live schema reconfirm (primary)

Query results (presence counts only; no row payloads):

| Check | Result |
| --- | --- |
| `accounts.ledger_id` | **present** (1) |
| `accounts.visibility` | **absent** (0) — expected post-0015 |
| `membership.status` / `observed_*` | **present**; `is_active` **absent** |
| `household.create_request_id` / `members_reconciled_at` | **present** |
| `user.memberships_reconciled_at` | **present** |
| tables `ledger`, `widget_handoff`, `deletion_operation`, `deleted_identity` | **present** |
| legacy `session` / `account` / `verification` / `invite_code` | **absent** |
| table owner (`accounts`, `membership`, …) | **`postgres`** |

**Verdict: DDL 0011–0015 already applied on PlanetScale `trove/main` — PASS (schema completeness).**

## 4. How this relates to Deploy `42703`

Deploy Worker run [34713619532](https://github.com/Stringsaeed/money-management/actions/runs/34713619532) fails ensure with many `42501` (must be owner) then hard `42703` (`visibility` / earlier `ledger_id`). That pattern means the **deploy role cannot ALTER** tables owned by `postgres`, then the ensure script references columns its denied ADD never created — **not** that privileged `trove/main` is missing the cutover schema.

- Soft-fail cascade: owner merge [#266](https://github.com/Stringsaeed/money-management/pull/266) (agents do **not** merge).
- Schema completeness for Sync: **already PASS** via prior privileged apply (this reconfirm).
- Agent-env cannot re-apply as table owner without invented DSNs; PlanetScale MCP write deferred (no human confirm; not needed).

## 5. Live webhook (unchanged)

`POST https://auth.trove.ing/webhooks/workos` → **HTTP 503** (`WORKOS_WEBHOOK_SECRET` not configured). Still **BLOCKED** until #266 merges + Deploy ships secret.

## Governance

Relates to #232 only. Do not Closes/Fixes #232 or #224. Do not merge #241 as certified. Do not invent secrets. Create Account / NativeButton / #258–#265 parked.
