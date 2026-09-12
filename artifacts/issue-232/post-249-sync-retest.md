# Post-#249 Sync / listMine retest — FAIL

Relates to #232 only. Never Closes #232 or #224.

## Deploy gate

| Field | Value |
| --- | --- |
| Deploy Worker | [34662626320](https://github.com/Stringsaeed/money-management/actions/runs/34662626320) |
| Conclusion | **success** |
| Tip deployed | `79b83d6eeaaab7479f7c62ea0174343504d02cf6` (#249 ensure-user timestamps + hasPgCode) |
| Ensure step | **soft-fail** Postgres **`42501`** — `memberships_reconciled_at` still **`present: false`** |
| Deploy Worker step | **success** |
| Live API | `https://auth.trove.ing` root **200** |

## Sync / listMine outcome

| Field | Value |
| --- | --- |
| Auth / JWT verify | **PASS** — protected RPC reached (WorkOS authenticate 200; not 401 / not `claim_iss`) |
| Path | `POST …/rpc/households/listMine` (Profile open / household **Try again**; Sync just for me) |
| HTTP | **500** |
| Client oRPC code | **`INTERNAL_SERVER_ERROR`** |
| Client message | `Internal server error` |
| Client body (verbatim) | `{"json":{"defined":false,"code":"INTERNAL_SERVER_ERROR","status":500,"message":"Internal server error"}}` |
| CDP evidence | `req_16`…`req_29` in `cdp-listMine-500-bodies-post249.txt` / `cdp-listMine-500-latest-post249.txt` |
| UI | Household sync paused + **Try again**; Sync → **Internal server error** (`authkit-90`…`authkit-92`) |
| Related RPC | `POST …/rpc/migration/getManifest` also **500** (`req_25`) |
| Owner CF Worker log (provided) | **`pg_code=42703`** `cause=column membership.status does not exist` — Failed query filters `membership.status = active` on JOIN membership/household |
| Client-visible pg_code | Unavailable (sanitized body) |

## Verdict shorthand

**auth PASS / listMine FAIL (`INTERNAL_SERVER_ERROR` 500; owner CF `42703` `membership.status`).**

#249 cleared the hypothesized `23502` ensure-user path; live Sync still fails on a **different** missing column. Ensure soft-fail `42501` unchanged. Do not soft-claim PASS. Do not treat #232 as certified. Parent #224 stays open.

## Evidence files

- `post-249-listmine-500.txt`
- `cdp-listMine-500-bodies-post249.txt`
- `cdp-listMine-500-latest-post249.txt`
- `cdp-network-listMine-post249.txt`
- `deploy-34662626320-ensure-softfail.txt`
- `authkit-90-post249-profile.png` … `authkit-92-post249-after-sync.png`
- `agent-device-*-post249*.txt`
