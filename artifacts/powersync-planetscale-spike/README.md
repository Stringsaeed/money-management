# How to rerun the Z0 PlanetScale and PowerSync spike

This directory is the Z0 proof. It does not change `apps/`, `packages/`, or `tools/`. The operator database is PlanetScale Postgres `trove` in org `stringsaeed`. Workers use a cache-disabled Hyperdrive named `trove-ledger-fresh`. PowerSync replicates over the direct `:5432` host as the replication role, never through Hyperdrive. Local Open Edition is enough for `smoke.sh` to exit 0. Cloud is now proven on instance `Development` in region `eu`. A new `us` instance hit `PLAN_LIMIT_REACHED`.

Spike tables live only in schema `spike` (`spike.accounts`, `spike.categories`, `spike.transactions`, `spike.membership`). They never use `public` ledger names. Teardown drops publication `powersync` and `DROP SCHEMA spike CASCADE` only.

## What you need

- `pscale` logged in to org `stringsaeed`
- `npx wrangler@4` OAuth to the Cloudflare account that already has Hyperdrive `trove`
- `psql` from libpq (`brew install libpq` if it is missing)
- `jq`, `python3`, `curl`, `npm`
- Node 22 LTS for the client round trip (`engines.node` is `>=22 <23`). Node 26 fails `@powersync/node` / `better-sqlite3` native compile. Use `nvm use` with `.nvmrc`.
- `POWERSYNC_URL` and `POWERSYNC_TOKEN` for a PowerSync instance. Prefer the Cloud URL in `/tmp/z0-spike.env`. Local Open Edition at `http://127.0.0.1:8080` still works. `PS_ADMIN_TOKEN` is the Cloud PAT used to deploy and mint tokens. Without URL and token, smoke stops after the Hyperdrive insert and does not exit 0. Unset leftover `SPIKE_ROW_ID` before a fresh smoke so the Worker insert is a new id.

Do not put passwords in this directory. `smoke.sh` writes them to `/tmp/z0-spike.env` with mode `600`. Direct URLs use `sslmode=verify-full&sslrootcert=system`.

## Run the proof

```bash
bash artifacts/powersync-planetscale-spike/smoke.sh
```

The script exits 0 only when all of these hold.

1. `pscale database show` reports `kind: postgresql`. Any other engine is a hard stop.
2. Direct `psql` on `:5432` reports `wal_level=logical`.
3. `spike.sql` creates the four tables under schema `spike`, grants `SELECT` to the replication role, and accepts `CREATE PUBLICATION powersync FOR TABLE spike.accounts, spike.categories, spike.transactions, spike.membership`.
4. `CREATE PUBLICATION ... FOR ALL TABLES` is attempted and recorded. This Postgres branch accepted it. The spike still uses an explicit table list for `powersync` and drops the `FOR ALL TABLES` publication.
5. Hyperdrive `trove-ledger-fresh` exists with caching disabled, and its id is not the cache-enabled `trove` config.
6. The throwaway Worker answers `SELECT 1` and inserts one `spike.transactions` row through that binding.
7. The PowerSync Node client (Node 22) sees that same `id` in the local SQLite file.

Receipts land in `/tmp/z0-spike-receipts/`. They must not include passwords.

## Bench

```bash
bash artifacts/powersync-planetscale-spike/smoke.sh --bench
```

The probe runs twenty `SELECT 1` calls on Hyperdrive and twenty on the direct `:5432` URL, interleaved. Record both p90 values. The plan rule is Hyperdrive p90 under 50 ms from a Worker in the PlanetScale region. A miss is recorded for the operator. It is not a script failure.

## Teardown

```bash
bash artifacts/powersync-planetscale-spike/smoke.sh --teardown
```

This deletes Worker `trove-z0-spike`, Hyperdrive `trove-ledger-fresh`, publication `powersync`, schema `spike`, and the spike roles. It does not touch Hyperdrive `trove` (`656e7684e86a457bafe573348a82376e`). Run teardown before Z2 creates real ledger tables on this database.

## Files

- `spike.sql` creates schema `spike`, tables, role grants, and publication.
- `teardown.sql` drops publication `powersync` and schema `spike` only.
- `sync-streams.yaml` is edition 3 with stream `spike_transactions` filtered by `auth.user_id()` through `spike.membership`.
- `worker.js` is the throwaway `SELECT 1` and `INSERT INTO spike.transactions ... RETURNING id` Worker.
- `roundtrip.mjs` waits for the inserted id in the PowerSync client file under Node 22.
- `check-node.mjs` refuses Node majors other than 22.
- `verdict.md` is the filled scorecard from the last successful run.
