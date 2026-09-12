# Post-schema Sync retest (0011–0015)

Relates to #232 only. Never Closes #232 or #224.

## Context

| Field | Value |
| --- | --- |
| When | 2026-09-12 ~01:20–01:45Z |
| Live API | `https://auth.trove.ing` |
| Worker | `money-management-server-prod-mfhkibosfd6z5ym5` |
| Schema | PlanetScale `trove/main` migrations **0011–0015** applied (ledger + `ledger_id`, `create_request_id`, `membership.status`, deletion tables; legacy session/account/verification dropped) |

Prior Sync failure was PG **42703** missing `accounts.ledger_id`. `households/listMine` was already **PASS** post-#250.

## Cloudflare Worker corroboration (authoritative HTTP)

Query window: `$metadata.message` contains `Manifest` on the service filter, **01:20–01:45Z**.

| Message | Verdict |
| --- | --- |
| `<-- POST /rpc/migration/getManifest` | request seen |
| `--> POST /rpc/migration/getManifest 200 216ms` | **PASS** |
| `--> POST /rpc/migration/getManifest 200 412ms` | **PASS** |

getManifest-needle events in window: **6**. No raw CDP/HAR or secrets committed.

## Outcomes

| Check | Result | Evidence |
| --- | --- | --- |
| Auth / JWT | **PASS** (prior) | post-#246 / post-#250 |
| `POST …/rpc/households/listMine` | **PASS** (prior) | post-#250 HTTP **200** |
| `POST …/rpc/migration/getManifest` | **PASS** | CF Worker **200** ×2 (216ms, 412ms) after DDL 0011–0015 |

## Verdict

**getManifest: PASS** (Cloudflare 200 evidence after schema 0011–0015).

Acceptance matrix remains **incomplete overall** — Relates-only evidence. **Do not treat #232 as certified.** Parent #224 stays open. No Closes.
