# Observability, Kill Switch & Local-Only Fallback (#99)

How the backend is observed, how writes can be paused remotely, and how the
mobile client behaves when sync is unavailable. Everything code-wireable is
wired in this repo; the only manual step is creating Cloudflare dashboard
resources that have no API surface in Alchemy (alerts), called out below.

## Stack context

The server is a **Cloudflare Worker** (no long-running host): logs go to
Workers Logs, metrics to **Workers Analytics Engine**, and remote config to a
Worker variable. There are no containers and no local files involved.

## Metrics pipeline

`packages/api/src/lib/observability/metrics.ts` defines a tiny recorder seam:

- `MetricEvent` — one of:
  - `command_rejection { rejectionKind, reason }` — every typed rejection from
    `commands.apply`. **Frequency = event count**; `rejectionKind` is the
    discriminated result kind (`stale_version`, `forbidden`, …) and `reason`
    is a short payload-free string (`expected_version_3_actual_7`,
    `transaction.create`, entity ids, …).
  - `latency_sample { operation, durationMs, outcome }` — one raw sample per
    call to `commands.apply`.
  - `operation_failure { operation, reason }` — unexpected throws from the
    command pipeline or its PlanetScale transaction.
  - `kill_switch_engaged` — a mutation was refused by the kill switch.
- Sinks:
  - **Analytics Engine** (`createMetricsSink`) when the deployment binds the
    `METRICS` dataset — wired in `packages/infra/alchemy.run.ts`
    (`Cloudflare.AnalyticsEngine.Dataset("metrics")`). Blob slots are fixed so
    SQL can group positionally: `[event, primaryDimension, detail]`; latency
    samples additionally carry `doubles[0] = durationMs`.
  - **Workers Logs JSON** (`createConsoleSink`) as the always-available
    fallback — single-line `{metric: true, event, ...}` objects.

The command router wraps its handler with `instrumentCommandApply`, which
never swallows errors: it observes and rethrows.

### Percentiles (p50/p95/p99)

Percentiles are computed at query time with Analytics Engine SQL over raw
samples (never in-process):

```sql
SELECT
  blobs[1] AS operation,
  quantile(0.50)(doubles[0]) AS p50,
  quantile(0.95)(doubles[0]) AS p95,
  quantile(0.99)(doubles[0]) AS p99,
  count() AS calls
FROM metrics
WHERE _timestamp > NOW() - INTERVAL '1' HOUR
  AND blobs[0] = 'latency_sample'
GROUP BY operation
```

Run it against the `metrics` dataset via
`wrangler analytics-engine query` or the Cloudflare dashboard → Storage &
Databases → Analytics Engine → SQL.

Rejection frequency per kind/reason:

```sql
SELECT blobs[1] AS rejection_kind, blobs[2] AS reason, count() AS count
FROM metrics
WHERE _timestamp > NOW() - INTERVAL '24' HOUR
  AND blobs[0] = 'command_rejection'
GROUP BY rejection_kind, reason
ORDER BY count DESC
```

## Dashboard & Workers Logs

`packages/infra/alchemy.run.ts` enables Workers observability on the `server`
Worker:

```ts
observability: {
  enabled: true,
  headSamplingRate: 1,
  logs: { enabled: true, invocationLogs: true, headSamplingRate: 1, persist: true },
}
```

Dashboard → Workers & Pages → `server` → **Observability** tab gives invocation
logs, console output (including the JSON metric fallback events), error rate,
and CPU per deployment. No further setup required.

## Error-tracker setup

Two layers, both configured in code:

1. **Structured events** — rejections, failures, and kill-switch hits land in
   Analytics Engine (`metrics` dataset) _and_ Workers Logs (fallback sink).
   Query them with the SQL above; retention follows the dataset settings in
   the Cloudflare dashboard (Analytics Engine data is retained ~90 days for
   SQL queries).
2. **Unhandled exceptions** — the oRPC `onError` interceptors in
   `apps/server/src/index.ts` log to `console.error`, which Workers Logs
   persists with level `error`. If a hosted tracker (Sentry etc.) is adopted
   later, attach it inside those interceptors — that is the single choke point
   for unhandled server errors.

## Remote kill switch: `KILL_SWITCH_LOCAL_ONLY`

**Carrier choice — a Worker env var, not KV.** The stack binds no KV namespace
today (`packages/infra/alchemy.run.ts`: Hyperdrive + Analytics Engine), and the
flag is one coarse, rarely-flipped toggle read once per mutation — KV's
eventual consistency buys nothing here. Documented trade-off: flipping the
variable requires an env update rather than an instant KV write.

- Server behavior: while engaged, `commands.apply` applies nothing and returns
  the typed result `{ kind: "local_only", reason: "kill_switch_local_only" }`.
  PowerSync keeps the last checkpoint cached locally. The probe endpoint is
  `sync.status` → `{ killSwitchLocalOnly: boolean }`.
- Toggle remotely (no code deploy):
  ```sh
  # set in packages/infra/.env then redeploy config
  KILL_SWITCH_LOCAL_ONLY=on pnpm --filter @trove/infra deploy
  ```
  or edit the variable in Dashboard → Workers & Pages → `server` → Settings →
  Variables & Secrets (`on` / `true` / `1` engage it; anything else is off).
- Client behavior: on startup the worker probes `sync.status()` before
  connecting PowerSync; while engaged it disconnects and shows local-only
  mode. An upload that reaches a switched-on server receives the typed
  `local_only` result and remains in PowerSync's upload queue rather than
  becoming a Rejected Changes entry.

## Graceful degradation (client)

- `apps/mobile/modules/powersync/availability.ts` tracks a continuous
  disconnected window from `PowerSyncDatabase.currentStatus.connected`.
- Once PowerSync has remained disconnected for **10+ minutes**
  (`POWERSYNC_DISCONNECT_THRESHOLD_MS`), `use-sync-worker` flips the app to
  local-only mode (`powersync_unavailable`); a connected status restores
  synced mode immediately.
- Mode lives in `stores/sync-mode-store.ts`; the persistent amber
  `SyncModeBanner` ("📴 Local-only mode") distinguishes both reasons and only
  appears in local-only mode — absence of the banner means synced.

## Alerts

Alerting rules live in the Cloudflare dashboard (no code surface yet).
Recommended setup after the first deploy:

1. **High error rate**: Dashboard → Notifications → Add → _Workers Alerts_
   template → scope to the `server` Worker → notify when error rate >
   threshold (suggest ≥ 1% of requests over 5 minutes) → webhook/email.
2. **Latency degradation & rejection spikes**: Notifications → Add → custom
   alert fed by a scheduled Analytics Engine SQL check. If your plan lacks
   AE-backed alert templates, run the percentile/rejection queries above from
   any external cron checker (e.g. GitHub Actions schedule or Better Uptime)
   against `wrangler analytics-engine query`, and alert when p95 exceeds its
   baseline (suggest 2× the trailing 7-day median) or
   `command_rejection` count grows abnormally.
3. **Kill-switch hygiene**: alert on sustained `kill_switch_engaged` volume —
   it means clients are still sending traffic while the switch is on.

## Deployment prerequisites

None beyond the existing pipeline: the `metrics` Analytics Engine dataset and
the observability flags are provisioned by Alchemy on the next
`pnpm --filter @trove/infra deploy`. First-time Analytics Engine use may ask
to enable the product in the dashboard. No KV namespace is required.
