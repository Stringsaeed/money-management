# Z0 verdict

Winner path for the spike proof. PowerSync Open Edition (self-hosted Docker on Colima) replicating from PlanetScale Postgres `trove/main` over direct `:5432`, with Worker writes through cache-disabled Hyperdrive. Rocicorp Zero was not used. Production still prefers PowerSync Cloud (#172) once a Cloud PAT exists. The Z0 connect proof used local Open Edition because Cloud auth was missing on this machine.

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

## PowerSync (local Open Edition against PlanetScale)

- Source host rule. Direct PlanetScale host on `:5432` as the role from `pscale role create --with-replication`. The Postgres role name is `pscale_api_<id>`, not `powersync_role`. The connection username is `pscale_api_<id>.<branch_id>`
- Local instance. `http://127.0.0.1:8080` via Colima + `journeyapps/powersync-service:latest`. Config under `.local/z0-powersync/` (not committed).
- Replication. Slot `powersync_1_0d29` created. Tables `spike.transactions|membership|accounts|categories` snapshot_done. Bucket storage held rows before the client connected.
- Sync filter. Token `sub` is `spike-user`. Membership is `spike-user` / `spike-house`. Checkpoints bucket `1#spike_transactions|0["spike-house"]`. A later insert `txn-z0-stackready-1788762595` used `household_id=hh-z0`. The client stream finished with 4 puts and never saw that id. That miss was the tenant filter, not a dead slot.
- Round trip. Proven under Node 22.22.2 with `@powersync/node` + `better-sqlite3` worker against local Open Edition `http://127.0.0.1:8080`. Worker insert `txn-z0-house-20260907063356` (`household_id=spike-house`) reached client SQLite in 160 ms. Full `smoke.sh` then inserted `txn-20260907063617` (`household_id=spike-house`, note `z0-roundtrip`) and the client saw it in 164 ms. Receipt `/tmp/z0-spike-receipts/roundtrip.json`. Cloud PAT still missing for a Cloud-hosted instance.

## Teardown

- Deferred until the Cloud connection is proven, so Hyperdrive and Worker stay available for that step
- `bash artifacts/powersync-planetscale-spike/smoke.sh --teardown` deletes Worker `trove-z0-spike`, Hyperdrive `trove-ledger-fresh`, publication `powersync`, schema `spike`, and the spike roles. It does not touch Hyperdrive `trove`. It never drops `public.*` ledger names. Run it before Z2.

## Bench

- Worker-reported Hyperdrive `SELECT 1` p50 206 ms, p90 454 ms. Worker colo `CDG`
- Direct `:5432` p90. Not recorded on that earlier receipt. Re-run `smoke.sh --bench` and keep both baselines.
- Rule. Hyperdrive p90 under 50 ms from a Worker in the PlanetScale region. Miss on the CDG sample. Operator decides at the review gate.

## Review gate

- `Z0-review-replication.png` is a `psql` `\dRp+` card from the live publication receipt. Tables are `spike.accounts`, `spike.categories`, `spike.membership`, and `spike.transactions`. This is not a dashboard replication-slot screenshot.
- `Z0-review-roundtrip.png` is a receipt card for Worker insert `txn-20260907063617` arriving in client SQLite in 164 ms (`household_id=spike-house`). The path is local Open Edition, not Cloud. Cloud PAT is still missing.
- `Z0-review.mp4` is a 32 second card video. It is not a live dashboard recording. The video still shows the older Worker-insert card. Trust the PNG and `/tmp/z0-spike-receipts/roundtrip.json` for client arrival.
- Hyperdrive p90 under 50 ms is still a miss on the CDG receipt (p90 454 ms). The later `SELECT 1` samples were 214 ms (AMS) and 367 ms (NRT). Operator decides at the review gate.
