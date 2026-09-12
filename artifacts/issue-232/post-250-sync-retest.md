# Post-#250 Sync / listMine retest

Relates to #232 only. Never Closes #232 or #224.

## Deploy gate

| Field | Value |
| --- | --- |
| Deploy Worker | [34663345218](https://github.com/Stringsaeed/money-management/actions/runs/34663345218) |
| Conclusion | **success** |
| Tip | `4171c2c8951a0e154cb0a9abfc2735f02ada22f2` (#250 soft-catch missing `membership.status` / 42703) |
| Live API | `https://auth.trove.ing` root **200** |

## Outcomes

| Check | Result | Evidence |
| --- | --- | --- |
| Auth / JWT | **PASS** | Signed-in Profile (`stringsaeed@gmail.com`); protected RPCs reached |
| `POST …/rpc/households/listMine` | **PASS** | HTTP **200**; body `{"json":[]}` (empty household list) |
| Household “Try again” UI | **PASS** | “Household sync is paused” banner cleared after retry |
| Sync just for me | **FAIL** | `POST …/rpc/migration/getManifest` HTTP **500**; client oRPC **`INTERNAL_SERVER_ERROR`** / `Internal server error` |

### Sanitized RPC signatures (no headers / secrets)

```
listMine     HTTP 200  body={"json":[]}
getManifest  HTTP 500  body={"json":{"defined":false,"code":"INTERNAL_SERVER_ERROR","status":500,"message":"Internal server error"}}
```

Prior post-#249 owner CF `pg_code=42703` (`membership.status`) is **cleared** for listMine on tip `4171c2c`. Sync path remains blocked on **getManifest** (client-only signature here; no CF Worker dump in this write).

## Verdict shorthand

**auth PASS / listMine PASS / Sync getManifest FAIL (`INTERNAL_SERVER_ERROR`).**

Do not treat #232 as certified. Parent #224 stays open. No raw CDP/HAR dumps committed (PostHog key leak lesson from prior dump).

## Evidence (sanitized)

- `post-250-rpc-bodies-sanitized.json` — RPC id, path label, body only
- `authkit-100-post250-after-listmine.png`
- `agent-device-after-hh-try-post250.txt` / `agent-device-final-post250.txt` — UI snapshots
