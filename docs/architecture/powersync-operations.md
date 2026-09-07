# PowerSync operations

This runbook covers the PlanetScale replication source, PowerSync Sync Streams, SDK buckets, and the self-host fallback. The Worker command path remains `commands.apply` over cache-disabled Hyperdrive; PowerSync connects directly to PlanetScale on port 5432 with its replication role.

## Current topology

| Component                   | Placement                   | Evidence source                                               |
| --------------------------- | --------------------------- | ------------------------------------------------------------- |
| PlanetScale Postgres        | `aws-us-east-1` host family | `PLANETSCALE_HOST` default in `packages/infra/alchemy.run.ts` |
| Cloudflare Worker           | targeted `aws:us-east-1`    | `packages/infra/alchemy.run.ts`                               |
| PowerSync Cloud Development | `eu`                        | PowerSync instance `6a9e0dd3a77ca1231d260e01`                 |

The development PowerSync instance is not region-aligned with PlanetScale and the Worker. The expanded 13-table publication and streams were verified on this instance at 278 ms direct replication p95 with 10 active buckets, but Z6 release certification must use a US-region PowerSync instance or explicitly record a reviewed latency exception; do not claim the one-region lane from the current EU instance.

## Replication slot health

Run this with a PlanetScale role allowed to inspect replication state:

```sql
SELECT
  slot_name,
  active,
  restart_lsn,
  confirmed_flush_lsn,
  pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn) AS lag_bytes
FROM pg_replication_slots
ORDER BY slot_name;
```

During a load probe, sample once per second. Certification requires exactly one PowerSync slot for the instance, `active = true`, an advancing `confirmed_flush_lsn`, and end-to-end apply-to-client p95 below two seconds. Alert when the slot is inactive for five minutes, `confirmed_flush_lsn` stops advancing while writes continue, or retained WAL grows continuously.

## Streams and buckets

`packages/powersync/sync-streams.yaml` defines three household-parameterized streams plus the automatic membership stream:

- `household_ledger` for accounts, categories, and transactions;
- `household_budget` for workspaces, envelopes, period-effective facts, assignments, and refund links;
- `household_recurring` for recurring rules and occurrences.

Subscription parameters narrow a stream but never authorize it. Every household query also checks `auth.user_id()` against `membership`; private-account-linked rules and transactions repeat the ownership predicate.

After deploying a config, inspect the PowerSync diagnostics for a representative owner and member. Record bucket count, downloaded row counts, and any `PSYNC_S2305` errors. The release ceiling is fewer than 1,000 buckets per user.

## Capacity and instance sizing

Capture these values before and during each 50-create run:

- concurrent connected clients;
- writes per second and apply-to-client p50/p95/p99;
- replication lag bytes and checkpoint latency;
- bucket count and downloaded rows per client;
- PowerSync CPU/memory and connection saturation from the service dashboard.

Increase the PowerSync instance size before raising client concurrency when CPU or memory remains above 70%, checkpoint latency trends upward, or reconnects begin during a steady probe. Change one capacity dimension at a time and rerun the same load fixture.

## Load probe

The committed lever creates two Better Auth users, joins them to one household, connects two PowerSync Node clients, sends 50 concurrent `transaction.create` intents through the public Worker, and measures visibility on device B:

```sh
Z6_WORKER_URL=https://<non-production-worker> \
Z6_TEST_PASSWORD=<test-password> \
pnpm --filter @trove/powersync load:verify
```

Use only a disposable non-production stage. The harness leaves its uniquely prefixed household fixture for audit; destroy the stage after collecting the report.

## Self-host switch

Use `deploy/powersync/docker-compose.yaml` only when PowerSync Cloud is unavailable or an operator has approved the fallback. Before switching:

1. Provision a direct PlanetScale replication credential and a separate PowerSync bucket-store credential.
2. Configure the same JWKS URI, audience, and `sync-streams.yaml` revision as Cloud.
3. Start the service and pass its liveness probe.
4. Run tenancy, private-account, bucket-count, and 50-create probes against the new endpoint.
5. Update `POWERSYNC_URL` only after the new endpoint passes; retain the former endpoint for rollback.
6. Roll back by restoring the former URL and reconnecting clients. Never point PowerSync replication through Hyperdrive.

## D1 retirement

The application stack exports no D1 resource, binding, or D1 migration directory. `packages/infra/no-d1-money.test.mjs` enforces that invariant. Historical D1 export artifacts remain evidence only and are not runtime inputs.
