# Post-schema Sync / getManifest retest (0011–0015)

Relates to #232 only. Never Closes #232 or #224.

## Context

| Field | Value |
| --- | --- |
| When | 2026-09-12 ~01:20–01:45Z (CF) + Mac UI corroboration same window |
| Live API | `https://auth.trove.ing` |
| Worker | `money-management-server-prod-mfhkibosfd6z5ym5` |
| Schema | PlanetScale `trove/main` migrations **0011–0015** applied (ledger + `ledger_id`, `create_request_id`, `membership.status`, deletion tables; legacy session/account/verification dropped) |
| Device | **iPhone 17 Pro** `6E4BBB8A-790E-4DDD-995B-6A3D1D9101DB` (**no stim**) |
| App | `com.stringsaeed.moneymanagement` signed in as `stringsaeed@gmail.com` |

Prior Sync failure was PG **42703** missing `accounts.ledger_id`. `households/listMine` was already **PASS** post-#250.

## Cloudflare Worker corroboration (authoritative HTTP)

Query window: `$metadata.message` contains `Manifest` on the service filter, **01:20–01:45Z**.

| Message | Verdict |
| --- | --- |
| `<-- POST /rpc/migration/getManifest` | request seen |
| `--> POST /rpc/migration/getManifest 200 216ms` | **PASS** |
| `--> POST /rpc/migration/getManifest 200 412ms` | **PASS** |

getManifest-needle events in window: **6**. No raw CDP/HAR or secrets committed.

## Mac UI corroboration (iPhone 17 Pro)

After **Sync just for me**:

- UI: **Upload to your cloud?** / **Upload once to cloud** / **Not now**
- Meaning: personal cloud empty check succeeded (getManifest path no longer INTERNAL_SERVER_ERROR)
- Screenshots: `authkit-102-postschema-upload-offer.png`, `authkit-103-postschema-final.png`
- Snapshots: `agent-device-after-sync-postschema.txt`, `agent-device-final-postschema.txt`

Client-side agent-device network dump had no CFNetwork HTTP lines in app log this session; CF Worker **200** is the HTTP signature.

## Outcomes

| Check | Result | Evidence |
| --- | --- | --- |
| Auth / JWT | **PASS** | Signed-in Profile; post-#246 / post-#250 |
| `POST …/rpc/households/listMine` | **PASS** (prior) | post-#250 HTTP **200** |
| `POST …/rpc/migration/getManifest` | **PASS** | CF Worker **200** ×2 (216ms, 412ms) + UI upload offer |

## Verdict

**getManifest PASS** (CF 200 + UI upload offer) after schema 0011–0015.

Acceptance matrix remains **incomplete overall** — Relates-only evidence. **Do not treat #232 as certified.** Parent #224 stays open. No Closes.
