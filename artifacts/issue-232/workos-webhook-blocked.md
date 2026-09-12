# WorkOS webhook receiver — BLOCKED (prod)

Relates to #232 only. **Never** Closes/Fixes #232 or parent #224.
Not a certification PASS. No secret values recorded.

## Verdict

| Field | Value |
| --- | --- |
| Status | **BLOCKED** |
| Endpoint | `POST https://auth.trove.ing/webhooks/workos` |
| Live result | **HTTP 503** |
| Body | `Webhook receiver is disabled: WORKOS_WEBHOOK_SECRET is not configured.` |
| Probe stamp | `2026-09-12T03:16:04Z` UTC |
| Worker | `money-management-server-prod-mfhkibosfd6z5ym5` (domain `auth.trove.ing`) |
| Dashboard webhook | `we_01M2945R34XC28KTEABF24F4CD` (signing secret **not** pasted here) |

Route is mounted correctly. This is **not** 404 / 401 / 500 / timeout.

## Live probe (this write)

| Request | Result |
| --- | --- |
| `GET https://auth.trove.ing/` | **200** `OK` |
| `GET /webhooks/workos` | **404** (POST-only) |
| `POST /webhooks/workos` (no signature) | **503** + disabled body |
| `POST /webhooks/workos` + fake `WorkOS-Signature` | **503** + same body (secret gate runs before verify) |

Raw transcript: `workos-webhook-probe-2026-09-12.txt`.

## Cause

Prod Alchemy/env `WORKOS_WEBHOOK_SECRET` is empty (`Config.withDefault` empty string). Handler treats falsy secret as receiver disabled → **503**. Local `.env` may still list the name as present; **prod binding is empty**.

## Owner unblock

1. Copy endpoint signing secret from WorkOS Dashboard webhook `we_01M2945R34XC28KTEABF24F4CD`.
2. Set production `WORKOS_WEBHOOK_SECRET` (do not invent or commit the value).
3. Redeploy prod server worker.
4. Confirm: `POST /webhooks/workos` without valid signature returns **400/401**, **not** 503.
5. Retry failed WorkOS deliveries; then re-certify membership projection / reconcile rows.

## Out of scope

Setting the secret, personal upload UI, closing #232/#224.
