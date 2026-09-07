# Z0 verdict

Winner path. PowerSync Cloud on PlanetScale Postgres, with Worker writes through a cache-disabled Hyperdrive. Rocicorp Zero was not used.

This file is the scorecard. A later commit fills every row after `smoke.sh` runs against live `trove` / `main`.

## Engine

- Command. `pscale database show trove --org stringsaeed`
- Result. `kind: postgresql`
- Hard stop. Not triggered

## wal_level

- Pending live `psql` on the direct `:5432` URL

## Publication

- Intended accepted statement. `CREATE PUBLICATION powersync FOR TABLE public.accounts, public.categories, public.transactions, public.membership`
- `FOR ALL TABLES`. Must be rejected. Pending live proof

## Hyperdrive

- Existing cache-enabled config. `trove` id `656e7684e86a457bafe573348a82376e` host `aws-us-east-1-3.pg.psdb.cloud` port `5432`
- Spike config. `trove-ledger-fresh` with `--caching-disabled`. Pending create
- URL proof. Direct `:5432` and the Hyperdrive id must differ. Pending

## PowerSync Cloud

- Source. Direct PlanetScale host on `:5432` as `powersync_role.<branch_id>`, never a Hyperdrive host
- Instance URL. Pending
- Replication. Pending `active`
- Round trip. Pending Worker insert id visible in the client SQLite file

## Teardown

- Worker `trove-z0-spike`. Pending delete
- Hyperdrive `trove-ledger-fresh`. Pending delete
- Spike tables and publication `powersync`. Pending delete

## Bench

- Pending `smoke.sh --bench`
- Rule. Hyperdrive `SELECT 1` p90 under 50 ms. A miss is recorded here for the operator and does not fail the spike
