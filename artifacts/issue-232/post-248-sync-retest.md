# Post-#248 Sync / listMine retest — FAIL

Relates to #232 only. Never Closes #232 or #224.

## Deploy gate

| Field | Value |
| --- | --- |
| Deploy Worker | [34661563595](https://github.com/Stringsaeed/money-management/actions/runs/34661563595) |
| Conclusion | **success** |
| Tip deployed | `0ab55ac783e15d66a675591028689e89741e5088` (#248 ensure-user omits `memberships_reconciled_at`) |
| Ensure step | **soft-fail** Postgres **`42501`** (`alter_permission_denied`) — column **`present: false`** |
| Ensure warning | `must be owner of table user` (no secrets) |
| Deploy Worker step | **success** (Worker code shipped despite ALTER soft-fail) |
| Live API | `https://auth.trove.ing` root **200** |

## Sync / listMine outcome

| Field | Value |
| --- | --- |
| Auth / JWT verify | **PASS** — protected RPC reached (not 401 / not `claim_iss`) |
| Path | `POST …/rpc/households/listMine` (Profile → household **Try again**; Sync just for me) |
| HTTP | **500** |
| Client oRPC code | **`INTERNAL_SERVER_ERROR`** |
| Client message | `Internal server error` |
| Client body (verbatim) | `{"json":{"defined":false,"code":"INTERNAL_SERVER_ERROR","status":500,"message":"Internal server error"}}` |
| CDP evidence | `req_5`…`req_8` in `cdp-listMine-500-bodies-post248.txt` |
| CFNetwork | `response_status=500` (`cfnetwork-post248-hits.txt`) |
| UI | Household sync paused + **Try again**; Sync showed **Internal server error** / Checking cloud (`authkit-81`…`authkit-83`) |
| Related RPC | `POST …/rpc/migration/getManifest` also **500** with same client body (`cdp-getManifest-500-body-post248.txt`) |
| Worker `orpc_error` / `pg_code` / Failed query | **Not captured this run** — Cloudflare Observability MCP `needsAuth`; local env name `CLOUDFLARE_API_TOKEN` **absent**; host curl to live RPC WAF **1010** |
| Hypothesized Worker root (PR #249) | Postgres **`23502`** NOT NULL on `created_at`/`updated_at` for #248 four-column INSERT when prod lacks DB defaults (PGlite-proven on #249; **not** re-read from CF Worker logs here) |
| Follow-up | [#249](https://github.com/Stringsaeed/money-management/pull/249) widens INSERT with `now()` + hardens `hasPgCode` — idle for Deploy Worker before Sync retest |
| Ensure column state | `memberships_reconciled_at` still **absent** after soft-fail 42501 |

## Verdict shorthand

**auth PASS / listMine FAIL (`INTERNAL_SERVER_ERROR` 500; hypothesized Worker `23502` per #249).**

Do not soft-claim PASS. Do not treat #232 as certified. Parent #224 stays open.

## Evidence files

- `post-248-listmine-500.txt`
- `cdp-listMine-500-bodies-post248.txt`
- `cdp-getManifest-500-body-post248.txt`
- `cfnetwork-post248-hits.txt`
- `deploy-34661563595-ensure-softfail.txt`
- `authkit-80-post248-profile.png` … `authkit-83-post248-final.png`
- `agent-device-*-post248*.txt`

## Matrix honesty

This Sync row alone does **not** certify the full #232 matrix. OTP AX, Android, PowerSync/PlanetScale mint, disposable reset, and live webhook apply remain out of scope / blocked as before.
