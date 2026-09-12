# #232 API-only isolation / auth-gate Relates (2026-09-12)

Relates to #232 only. **Never** Closes/Fixes #232 or parent #224.
No device. No Create Account claim. No webhook PASS. Matrix remains **incomplete**.

## Env hard-stop (live dual-identity)

Local process env **absent** (names only):

- `CERT_USER_A_TOKEN`, `CERT_USER_B_TOKEN` (or any dual-bearer aliases)
- `TEST_USER_A_BEARER`, `TEST_USER_B_BEARER`, `TROVE_TEST_TOKEN_A`, `TROVE_TEST_TOKEN_B`, `API_BEARER_A`, `API_BEARER_B`
- `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_REDIRECT_URI`, `WORKOS_CLAIM_TOKEN`, `WORKOS_COOKIE_PASSWORD`
- `EXPO_PUBLIC_WORKOS_CLIENT_ID`, `EXPO_PUBLIC_WORKOS_REDIRECT_URI`, `EXPO_PUBLIC_SERVER_URL`
- `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID`
- `PLANETSCALE_HOST`, `PLANETSCALE_DATABASE`, `PLANETSCALE_USER`, `PLANETSCALE_PASSWORD`, `DATABASE_URL`

**Consequence:** cannot mint or present two live session bearers → **live cross-User / cross-Household isolation** stays **BLOCKED**. Viewer-role live write denial also **BLOCKED** (no viewer bearer).

PlanetScale + Cloudflare Observability MCPs were **ready** (no local `PLANETSCALE_*` / `CLOUDFLARE_API_TOKEN` required for those paths).

## Evidence this write

| Claim | Status | Artifact |
| --- | --- | --- |
| Live API health | **PASS** | `GET https://auth.trove.ing/` → **200** `OK` |
| Missing bearer rejection | **PASS** | `listMine` / `get` / `create` / `getManifest` / `powersync/token` → **401** `missing_token` (`live-auth-gate-probe-2026-09-12.txt`) |
| Forged JWT rejection | **PASS** | Forged `Authorization: Bearer …` on `listMine` / `get` / `invite` / `setMemberRole` / `rename` (+ forged `householdId` / `targetUserId` in body) → **401** `invalid_token` — body org/user fields never honored |
| CF corroboration | **PASS** | Window 05:20–05:35Z: **7** `missing_token` + **8** `invalid_token` on worker `money-management-server-prod-mfhkibosfd6z5ym5` |
| Viewer-write denial (API seam) | **PASS** | `pipeline.test.ts` **18/18** including `rejects a viewer (read-only role) via the capability map` (`test-pipeline-viewer-deny.txt`) — previously absent from the captured 97-test run |
| Schema DDL 0011–0015 reconfirm | **PASS** | PlanetScale read-only: `accounts.ledger_id`, `membership.status`, `household.create_request_id`, `user.memberships_reconciled_at`, `ledger` table (`planetscale-schema-ddl-confirm-2026-09-12.txt`) |
| Live cross-User isolation | **BLOCKED** | Dual session tokens absent (names above) |
| Live cross-Household isolation | **BLOCKED** | Same |
| Live authenticated forged-org rejection after valid login | **BLOCKED** | Requires a valid bearer; gate stops at `invalid_token` |
| Live viewer-write denial | **BLOCKED** | No viewer-role bearer |
| WorkOS webhook apply | **BLOCKED** (unchanged) | `POST /webhooks/workos` → **503** empty `WORKOS_WEBHOOK_SECRET` |
| Create Account / one-device round-trip | **BLOCKED** (unchanged) | Device path; #257 Mac retest pending — **not** claimed PASS |

## Matrix rows moved

| Row / sub-criterion | Prior | Now |
| --- | --- | --- |
| Row 5 — Live API/stream isolation | not evidenced | **PARTIAL** — auth-gate forged/missing token **PASS**; dual-identity live isolation **BLOCKED** |
| Row 5 — Cross-scope / viewer capability | PARTIAL; `pipeline.test.ts` not in 97 | Viewer capability map **PASS** via `pipeline.test.ts` **18/18** (still PARTIAL overall — live dual-identity open) |
| Schema / DDL | PASS (prior post-schema) | **PASS** reconfirmed via PlanetScale read-only |
| Webhook | BLOCKED | **BLOCKED** (no change) |
| Create Account | BLOCKED | **BLOCKED** (no change; no device PASS) |

## Governance

- Relates to #232 only. Parent #224 stays open.
- Do **not** merge PR #241 as certified.
- Do **not** claim #232 complete.
