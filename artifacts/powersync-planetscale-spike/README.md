# How to rerun the Z0 PlanetScale and PowerSync spike

This directory is the Z0 proof. It does not change `apps/`, `packages/`, or `tools/`. The operator database is PlanetScale Postgres `trove` in org `stringsaeed`. Workers use a cache-disabled Hyperdrive named `trove-ledger-fresh`. PowerSync Cloud replicates over the direct `:5432` host as `powersync_role`, never through Hyperdrive.

## What you need

- `pscale` logged in to org `stringsaeed`
- `npx wrangler@4` OAuth to the Cloudflare account that already has Hyperdrive `trove`
- `psql` from libpq (`brew install libpq` if it is missing)
- `jq`, `python3`, `curl`, `npm`
- PowerSync Cloud credentials in the environment. Use `PS_ADMIN_TOKEN`, or set `POWERSYNC_URL` and `POWERSYNC_TOKEN` after you mint a development token. Without those, `smoke.sh` stops after the Hyperdrive insert and does not exit 0

Do not put passwords in this directory. `smoke.sh` writes them to `/tmp/z0-spike.env` with mode `600`. Direct URLs use `sslmode=verify-full&sslrootcert=system`.

## Run the proof

```bash
bash artifacts/powersync-planetscale-spike/smoke.sh
```

The script exits 0 only when all of these hold.

1. `pscale database show` reports `kind: postgresql`. Any other engine is a hard stop.
2. Direct `psql` on `:5432` reports `wal_level=logical`.
3. `spike.sql` creates the four tables, grants `SELECT` to `powersync_role`, and accepts `CREATE PUBLICATION powersync FOR TABLE public.accounts, public.categories, public.transactions, public.membership`.
4. `CREATE PUBLICATION ... FOR ALL TABLES` is attempted and recorded. This Postgres branch accepted it. The spike still uses an explicit table list for `powersync` and drops the `FOR ALL TABLES` publication.
5. Hyperdrive `trove-ledger-fresh` exists with caching disabled, and its id is not the cache-enabled `trove` config.
6. The throwaway Worker answers `SELECT 1` and inserts one `transactions` row through that binding.
7. The PowerSync Node client sees that same `id` in the local SQLite file.

Receipts land in `/tmp/z0-spike-receipts/`. They must not include passwords.

## Bench

```bash
bash artifacts/powersync-planetscale-spike/smoke.sh --bench
```

The probe runs twenty `SELECT 1` calls on Hyperdrive and twenty on the direct `:5432` URL, interleaved. The plan rule is Hyperdrive p90 under 50 ms from a Worker in the PlanetScale region. A miss is recorded for the operator. It is not a script failure.

## Teardown

```bash
bash artifacts/powersync-planetscale-spike/smoke.sh --teardown
```

This deletes Worker `trove-z0-spike`, Hyperdrive `trove-ledger-fresh`, the four spike tables, publication `powersync`, and the spike roles. It does not touch Hyperdrive `trove` (`656e7684e86a457bafe573348a82376e`).

## Files

- `spike.sql` creates the tables, role grants, and publication.
- `teardown.sql` drops the publication, tables, and leftover `spike` schema.
- `sync-streams.yaml` is edition 3 with stream `spike_transactions` filtered by `auth.user_id()` through `membership`.
- `worker.js` is the throwaway `SELECT 1` and `INSERT ... RETURNING id` Worker.
- `roundtrip.mjs` waits for the inserted id in the PowerSync client file.
- `verdict.md` is the filled scorecard from the last successful run.
