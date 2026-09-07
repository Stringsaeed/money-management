# Z6 expanded Sync Streams live receipt

- Date: 2026-09-07
- PowerSync instance: Development `6a9e0dd3a77ca1231d260e01` (`eu`)
- Source: non-production PlanetScale Postgres, direct replication connection
- Publication: 13 tables
- Stream config deployment: passed
- Validation: passed
- Run ID: `z3-1788808776802`

## Isolation

- Household owner received all shared ledger, budget, and recurring rows.
- Household member received all shared budget rows and the public-account Recurring Rule.
- The member did not receive the private-account Recurring Rule or its occurrence.
- The non-member received no household ledger, budget, recurring, or occurrence rows.

## Replication latency

- Warmup inserts: 10
- Measured inserts: 20
- p95: 292 ms
- Acceptance rule: p95 under 2,000 ms
- Result: pass

The harness retained its uniquely prefixed append-only fixture for audit. This receipt measures direct PlanetScale-to-PowerSync client visibility; the Worker `commands.apply` load receipt is tracked separately.
