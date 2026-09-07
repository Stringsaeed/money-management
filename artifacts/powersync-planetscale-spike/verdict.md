# Z0 verdict

Winner path. PowerSync Cloud on PlanetScale Postgres, with Worker writes through a cache-disabled Hyperdrive. Rocicorp Zero was not used.

Live run was against org `stringsaeed`, database `trove`, branch `main`, host `aws-us-east-1-3.pg.psdb.cloud`.

## Engine

- Command. `pscale database show trove --org stringsaeed`
- Result. `kind: postgresql`
- Hard stop. Not triggered

## wal_level

- Command. `psql` on the direct `:5432` URL with `sslmode=verify-full&sslrootcert=system`
- Result. `wal_level=logical`

## Publication

- Accepted statement. `CREATE PUBLICATION powersync FOR TABLE public.accounts, public.categories, public.transactions, public.membership`
- `\dRp+ powersync` lists those four tables. `All tables` is `f`
- `FOR ALL TABLES`. This engine accepted `CREATE PUBLICATION powersync_forall FOR ALL TABLES`. The spike dropped that publication immediately. The plan said PlanetScale rejects `FOR ALL TABLES`. That is not true on this Postgres branch today. The `powersync` publication still uses an explicit table list

## Hyperdrive

- Existing cache-enabled config. `trove` id `656e7684e86a457bafe573348a82376e` host `aws-us-east-1-3.pg.psdb.cloud` port `5432` `caching.disabled=false`
- Spike config. `trove-ledger-fresh` id `8e9800a6f0ff4d738ccde750c2120dd1` origin port `6432` `caching.disabled=true`
- URL proof. Direct `:5432` and Hyperdrive id `8e9800a6f0ff4d738ccde750c2120dd1` differ. Hyperdrive origin is pooled `:6432`. PowerSync must keep using `:5432`

## Worker

- Name. `trove-z0-spike`
- URL. `https://trove-z0-spike.stringsaeed.workers.dev`
- `SELECT 1`. `{"n":1}`
- Insert. `{"id":"txn-z0-1"}` into `public.transactions`

## PowerSync Cloud

- Source host rule. Direct PlanetScale host on `:5432` as the `powersync_role` created by `pscale role create --with-replication`. The Postgres role name is `pscale_api_<id>`, not `powersync_role`. The connection username is `pscale_api_<id>.<branch_id>`
- Instance URL. Missing. `npx powersync fetch instances` reports not logged in. No `PS_ADMIN_TOKEN` on this machine
- Replication. Not proven. Dashboard access was not available to this owner
- Round trip. Worker insert id `txn-z0-1` exists on PlanetScale. The PowerSync Node client file was not populated. `@powersync/node` failed to build on Node 26 (`better-sqlite3`). Cloud PAT is the remaining gate

## Teardown

- Deferred until the Cloud connection is proven, so the publication and Hyperdrive stay available for that step
- `bash artifacts/powersync-planetscale-spike/smoke.sh --teardown` deletes Worker `trove-z0-spike`, Hyperdrive `trove-ledger-fresh`, the four tables, publication `powersync`, and the spike roles. It does not touch Hyperdrive `trove`

## Bench

- Worker-reported Hyperdrive `SELECT 1` p50 206 ms, p90 454 ms. Worker colo `CDG`
- Rule. Hyperdrive p90 under 50 ms from a Worker in the PlanetScale region. Miss. This machine is far from `us-east`, and Smart Placement had not pinned the Worker to that region
- Client RTT from this host was ~650 ms p90 and is not the plan metric
- Operator decides at the review gate

## Review gate

- `Z0-review-replication.png` is the publication receipt
- `Z0-review-roundtrip.png` is the Worker insert receipt. The client SQLite arrival is still pending Cloud
- `Z0-review.mp4` is a 32 second card video of engine, Hyperdrive, insert, and publication. It is not a live dashboard recording
