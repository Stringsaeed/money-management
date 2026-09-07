# Trove PowerSync configuration

This package is the reviewed source for Trove's PowerSync Sync Streams. The mobile client reads PowerSync-backed collections and sends command metadata through the SDK upload queue; no parallel delta poll or custom outbox remains.

## Cloud target

- Preferred service: PowerSync Cloud.
- Z0 proof instance: `Development` in the `trove` project, currently in region `eu`.
- Instance URL: supply the dashboard's Connect URL as `POWERSYNC_URL`.
- Source database: PlanetScale Postgres over its direct TLS connection on port `5432` using the replication role.
- Never use Hyperdrive as the PowerSync replication source. Hyperdrive remains the Worker path for `commands.apply`.
- Publication: `powersync` contains membership, ledger, budget, refund-link, and recurring fact tables. `packages/api/src/lib/powersync-publication.test.ts` locks the exact list.
- Every published source table has one text primary key named `id`; migration 0009 backfills and converts the expanded domain tables before adding them to the publication.

## Sync Streams

`sync-streams.yaml` uses edition 3 and exposes four streams:

- `memberships` automatically syncs the signed-in user's memberships at priority 1.
- `household_ledger` is on demand. The client supplies `household_id`, but every query also proves membership with the signed JWT `sub`. Account and transaction queries apply private-account ownership rules.
- `household_budget` streams workspaces, envelopes, period-effective facts, assignments, and refund links.
- `household_recurring` streams rules and occurrences and repeats private-account ownership checks.

The subscription parameter is client controlled and is never treated as authorization by itself.

## Custom authentication

The Worker issues 30-minute ES256 tokens from the protected `powersync.token` RPC. Configure the Cloud instance with:

- JWKS URI: `https://<worker-host>/api/powersync/jwks.json`
- Audience: the exact `POWERSYNC_URL`
- Maximum token age: 60 minutes

Set these Worker secrets/config values without committing their contents:

- `POWERSYNC_URL`
- `POWERSYNC_JWT_PRIVATE_KEY`, a PKCS#8 P-256 PEM
- `POWERSYNC_JWT_KID`, a stable key identifier

Generate a compatible private key locally with:

```sh
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out powersync-private.pem
```

Store the PEM as a local secret or CI secret, then remove the local file. The JWKS endpoint derives and exposes only the public coordinates.

## Validate and deploy

PowerSync CLI 0.10 requires a linked instance. Either run `powersync link cloud --instance-id=<id>` locally, which writes ignored `cli.yaml`, or provide `PS_ADMIN_TOKEN` and `INSTANCE_ID` in the environment.

```sh
pnpm --filter @trove/powersync test
pnpm --filter @trove/powersync validate
pnpm --filter @trove/powersync deploy
```

`validate` validates only `sync-streams.yaml`. `deploy` deploys only the Sync Streams config, not the source connection or client-auth dashboard settings. The operator must configure those settings and run deploy against the intended non-production instance.

## Live verification

The Node harness uses three signed users to prove household tenancy, same-household private-account isolation, and replication latency. It seeds uniquely named rows, runs ten warmups plus twenty measured inserts, and removes only those rows when it exits.

```sh
export POWERSYNC_URL=https://<instance>.powersync.journeyapps.com
export POWERSYNC_JWT_KID=<configured-key-id>
export POWERSYNC_JWT_PRIVATE_KEY_FILE=/secure/path/powersync-private.pem
export Z3_LIVE_DATABASE_URL='postgresql://<writer>@<direct-host>:5432/postgres'
pnpm --filter @trove/powersync live:verify
```

This harness measures direct PlanetScale-to-client replication. The release receipt must separately prove `commands.apply` through the Worker reaches the same connected client under the two-second rule.

## Self-host fallback

The unlaunched fallback is under `deploy/powersync`. It uses a direct PlanetScale source URI, a separate local Postgres bucket store, the same Sync Streams file, and the Worker's public JWKS endpoint.

Required environment variables:

- `PS_SOURCE_DATABASE_URI`: direct PlanetScale `:5432` replication URL, never Hyperdrive
- `PS_STORAGE_PASSWORD`: local bucket-store password
- `PS_JWKS_URI`: public Worker JWKS URL
- `PS_AUDIENCE`: token audience, matching the PowerSync endpoint
- `PS_API_TOKEN`: self-host admin API token

Start only on an isolated verification machine:

```sh
docker compose -f deploy/powersync/docker-compose.yaml up
curl --fail http://127.0.0.1:8080/probes/liveness
```

This fallback is not deployed by Z3.
