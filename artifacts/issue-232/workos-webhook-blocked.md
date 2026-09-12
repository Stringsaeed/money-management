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
| Probe stamp | `2026-09-12T03:16:04Z` UTC (initial); re-probe `2026-09-12T05:47Z` still **503** (`workos-webhook-probe-2026-09-12b.txt`); re-probe `2026-09-12T06:30:58Z` still **503** (`workos-webhook-probe-2026-09-12d.txt`); re-probe `2026-09-12T07:54:12Z` still **503** (`workos-webhook-probe-2026-09-12e.txt`); re-probe `2026-09-12T14:19:32Z` still **503** (`workos-webhook-probe-2026-09-12T141932Z.txt`); **post-#259** re-probe `2026-09-12T19:23:27Z` still **503** (`workos-webhook-probe-2026-09-12T192327Z.txt`) |
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

## Post-#259 note (`2026-09-12T19:23:27Z`)

[#259](https://github.com/Stringsaeed/money-management/pull/259) **merged** wiring to `main` (`c1adeb4`), but Deploy Worker [34713619532](https://github.com/Stringsaeed/money-management/actions/runs/34713619532) **failed with 0 steps** — annotation: *job was not started because recent account payments have failed or your spending limit needs to be increased*. `WORKOS_WEBHOOK_SECRET` never reached prod; live still **503**. [#232](https://github.com/Stringsaeed/money-management/issues/232) was falsely closed by that merge and **reopened**. Hard-stop: no deploy-workflow code-fix PR. See `workos-webhook-after-259-still-503.md`.

## Owner unblock

1. Clear GitHub Actions billing / spending-limit block (payments or spending limit).
2. Copy endpoint signing secret from WorkOS Dashboard webhook `we_01M2945R34XC28KTEABF24F4CD`.
3. Set GitHub Actions / production `WORKOS_WEBHOOK_SECRET` (do not invent or commit the value).
4. Redeploy prod server worker (Deploy Worker must succeed after #259 wiring).
5. Confirm: `POST /webhooks/workos` without valid signature returns **400/401**, **not** 503.
6. Retry failed WorkOS deliveries; then re-certify membership projection / reconcile rows.

## Out of scope

Setting the secret, personal upload UI, closing #232/#224.
