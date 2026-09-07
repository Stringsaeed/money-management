# Z6 public Worker load receipt

- Date: 2026-09-07
- Target: disposable non-production Cloudflare Worker stage `z6_verify_pool10`
- Path: public `commands.apply` -> cache-disabled `HYPERDRIVE_FRESH` -> PlanetScale Postgres -> PowerSync Cloud -> two authenticated PowerSync clients
- Concurrency: 50 `transaction.create` commands per run
- Acceptance rule: all 50 rows visible on both clients and device-B p95 below 2,000 ms

## Baseline diagnosis

The first correct-database run used the original household-wide advisory lock. All 50 rows reached both clients, but device-B p95 was 3,770 ms. The lock serialized otherwise independent append-only transaction creates.

The final implementation keeps the advisory lock for state-dependent commands and lets `transaction.create` allocate its change sequence with an atomic per-household counter. The Worker uses one Postgres client connection per isolate and Hyperdrive is capped at 15 origin connections.

## Final runs

| Run ID             | Device A rows | Device B rows | Device-B p95 | Result |
| ------------------ | ------------: | ------------: | -----------: | ------ |
| `z6-1788811376847` |            50 |            50 |     1,771 ms | pass   |
| `z6-1788811387227` |            50 |            50 |     1,699 ms | pass   |
| `z6-1788811394862` |            50 |            50 |     1,725 ms | pass   |

All three consecutive final runs passed. The worst final p95 was 1,771 ms, 53.0% lower than the 3,770 ms serialized baseline. Across the three runs, both clients observed all 150 expected rows.

## Teardown and replication health

- The disposable Worker and Hyperdrive resource were deleted after the probe.
- The deleted Worker endpoint returned HTTP 404.
- All 14 remaining idle `postgres.js` sessions from the disposable stage were terminated.
- Direct PlanetScale access remained available while the 15-connection cap was exercised.
- The only remaining replication slot was `powersync_6a9e0dd3a77ca1231d260e01_3_d1bd`; it was active with zero lag bytes after cleanup.

Result: **pass**.
