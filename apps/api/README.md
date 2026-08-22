# trove-api

Hono service implementing the backend command pipeline (`/commands`, `/sync`).
Phase 0 skeleton: JWT verification against Supabase's JWKS endpoint and a health check (issue #81).

## Run locally

```sh
# From repo root
pnpm install
SUPABASE_URL=https://<project-ref>.supabase.co pnpm --filter @trove/api dev
```

## Environment

| Variable            | Required | Description                                                   |
| ------------------- | -------- | ------------------------------------------------------------- |
| `SUPABASE_URL`      | yes      | Supabase project URL; issuer is `{SUPABASE_URL}/auth/v1`      |
| `PORT`              | no       | Listen port (default `3000`)                                  |
| `SUPABASE_JWKS_URL` | no       | Override the JWKS endpoint (tests, self-hosted auth gateways) |

## Endpoints

- `GET /health` — unauthenticated liveness probe.
- `GET /me` — authenticated; echoes verified claims (`userId`, `householdRoles`, `activeHouseholdId`) stamped by Supabase's custom access token hook. Claims are a latency filter only; live membership is re-checked per command once the command pipeline lands.

## Test

```sh
pnpm --filter @trove/api test
```

Tests spin up a local JWKS server and sign real ES256 tokens, so signature,
issuer, and expiry verification run against a remote key set just like production.

## Docker

Build context is the repository root so pnpm can link workspace packages:

```sh
docker build -f apps/api/Dockerfile -t trove-api .
docker run -p 3000:3000 -e SUPABASE_URL=https://<project-ref>.supabase.co trove-api
```
