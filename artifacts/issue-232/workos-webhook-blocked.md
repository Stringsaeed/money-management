# WorkOS webhook receiver — secret LIVE; signature gate (prod)

Relates to #232 only. **Never** Closes/Fixes #232 or parent #224.
Not a full membership-apply certification PASS. No secret values recorded.

## Verdict

| Field | Value |
| --- | --- |
| Status | **PROGRESS** (secret configured; unsigned/bad-sig → 400/401) |
| Endpoint | `POST https://auth.trove.ing/webhooks/workos` |
| Live result (no sig) | **HTTP 400** `Missing WorkOS-Signature header.` |
| Live result (fake sig) | **HTTP 401** `Signature verification failed.` |
| Prior | **HTTP 503** secret-missing (through post-#259) |
| Probe stamp | `2026-09-12T20:06:41Z` UTC (`workos-webhook-probe-2026-09-12T200641Z.txt`); earlier 503 probes retained for history |
| Worker | `money-management-server-prod-mfhkibosfd6z5ym5` (domain `auth.trove.ing`) |
| Dashboard webhook | `we_01M2945R34XC28KTEABF24F4CD` (signing secret **not** pasted here) |

Route is mounted correctly. Secret gate no longer disables the receiver.

## Live probe (this write)

| Request | Result |
| --- | --- |
| `GET https://auth.trove.ing/` | **200** `OK` |
| `POST /webhooks/workos` (no signature) | **400** `Missing WorkOS-Signature header.` |
| `POST /webhooks/workos` + fake `WorkOS-Signature` | **401** `Signature verification failed.` |
| Signed delivery | **SKIPPED** — agent `WORKOS_WEBHOOK_SECRET` MISSING; do not invent |

## Post-#266 / Deploy note (`2026-09-12T20:03–20:06Z`)

[#266](https://github.com/Stringsaeed/money-management/pull/266) **merged** (`33a8ba23`) — soft-fail ensure after `42501`/`42703`/`42P01`. Deploy Worker [34715924235](https://github.com/Stringsaeed/money-management/actions/runs/34715924235) **SUCCESS**: ensure step exit 0 despite `42501` (+ soft-fail `42703` on missing `visibility`); Deploy continued; `workos_webhook_secret_set=yes`; Alchemy updated `[server/WORKOS_WEBHOOK_SECRET]`. Live left **503** → **400/401**. See `post-266-deploy-webhook-progress-2026-09-12T2006Z.md`.

## Historical (pre-#266)

- Post-#259: Deploy [34713619532](https://github.com/Stringsaeed/money-management/actions/runs/34713619532) billing/0-steps then later schema-ensure hard-fail — secret never reached prod → **503**. See `workos-webhook-after-259-still-503.md`.

## Owner still needed for membership-apply PASS

1. Retry failed WorkOS Dashboard deliveries (or send a real signed event).
2. Optionally supply agent-env `WORKOS_WEBHOOK_SECRET` for a signed probe Relates stamp (do not invent).
3. Continue #232 matrix: Create Account / `CERT_USER_*` / PowerSync / Android / OTP — separate blockers.
4. Keep #232/#224 open until owner acceptance.

## Out of scope

Inventing the secret, closing #232/#224, claiming full webhook membership apply PASS.
