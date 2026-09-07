# Z0 verdict

Intended path. PowerSync Cloud on PlanetScale Postgres, with Worker writes through a cache-disabled Hyperdrive. Rocicorp Zero was not used. PowerSync Cloud replication and the client round trip are still unproven, so this is not a winner declaration.

Live run was against org `stringsaeed`, database `trove`, branch `main`, host `aws-us-east-1-3.pg.psdb.cloud`.

## Engine

- Command. `pscale database show trove --org stringsaeed`
- Result. `kind: postgresql`
- Hard stop. Not triggered

## wal_level

- Command. `psql` on the direct `:5432` URL with `sslmode=verify-full&sslrootcert=system`
- Result. `wal_level=logical`

## Publication

- Accepted statement. `CREATE PUBLICATION powersync FOR TABLE spike.accounts, spike.categories, spike.transactions, spike.membership`
- Tables live only in schema `spike`. Root dropped the earlier mistaken `public.*` spike tables before this rewrite.
- `FOR ALL TABLES`. This engine accepted `CREATE PUBLICATION powersync_forall FOR ALL TABLES`. The spike drops that publication immediately. The plan said PlanetScale rejects `FOR ALL TABLES`. That is not true on this Postgres branch today. The `powersync` publication still uses an explicit table list.

## Hyperdrive

- Existing cache-enabled config. `trove` id `656e7684e86a457bafe573348a82376e` host `aws-us-east-1-3.pg.psdb.cloud` port `5432` `caching.disabled=false`
- Spike config. `trove-ledger-fresh` id `8e9800a6f0ff4d738ccde750c2120dd1` origin port `6432` `caching.disabled=true`
- URL proof. Direct `:5432` and Hyperdrive id `8e9800a6f0ff4d738ccde750c2120dd1` differ. Hyperdrive origin is pooled `:6432`. PowerSync must keep using `:5432`

## Worker

- Name. `trove-z0-spike`
- URL. `https://trove-z0-spike.stringsaeed.workers.dev`
- `SELECT 1`. `{"n":1}` after redeploy (colo `FRA` on the safety rewrite sample)
- Insert. `{"id":"txn-z0-spike-2"}` into `spike.transactions` after redeploy

## PowerSync Cloud

- Source host rule. Direct PlanetScale host on `:5432` as the role from `pscale role create --with-replication`. The Postgres role name is `pscale_api_<id>`, not `powersync_role`. The connection username is `pscale_api_<id>.<branch_id>`
- Instance URL. Claimed in an earlier draft as `https://6a9e0dd3a77ca1231d260e01.powersync.journeyapps.com`. Not verified by `powersync fetch instances` on this machine. Treat as unconfirmed until PAT login succeeds.
- Replication. Not proven
- Round trip. Not proven. Two separate blockers: (1) no `PS_ADMIN_TOKEN` / `POWERSYNC_URL`+`POWERSYNC_TOKEN`, (2) `@powersync/node` fails to build on Node 26. Round trip must run under Node 22 (see `.nvmrc` and `check-node.mjs`).

## Teardown

- Deferred until the Cloud connection is proven, so Hyperdrive and Worker stay available for that step
- `bash artifacts/powersync-planetscale-spike/smoke.sh --teardown` deletes Worker `trove-z0-spike`, Hyperdrive `trove-ledger-fresh`, publication `powersync`, schema `spike`, and the spike roles. It does not touch Hyperdrive `trove`. It never drops `public.*` ledger names. Run it before Z2.

## Bench

- Worker-reported Hyperdrive `SELECT 1` p50 206 ms, p90 454 ms. Worker colo `CDG`
- Direct `:5432` p90. Not recorded on that earlier receipt. Re-run `smoke.sh --bench` and keep both baselines.
- Rule. Hyperdrive p90 under 50 ms from a Worker in the PlanetScale region. Miss on the CDG sample. Operator decides at the review gate.

## Review gate

- `Z0-review-replication.png` is a publication receipt card, not a dashboard replication-slot screenshot
- `Z0-review-roundtrip.png` is a Worker insert receipt card. Client SQLite arrival is still pending Cloud + Node 22
- `Z0-review.mp4` is a 32 second card video. It is not a live dashboard recording
