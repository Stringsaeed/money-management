# Membership revocation bound (#228)

## What updates access

1. Verified WorkOS webhooks project Membership changes as soon as they arrive.
2. Stale projections are refreshed from WorkOS list APIs:
   - User bootstrap on Household list reads (`USER_RECONCILE_MAX_AGE_MS` = 60s)
   - Household member list on Household detail reads (`HOUSEHOLD_RECONCILE_MAX_AGE_MS` = 60s)
   - User bootstrap on PowerSync token issuance (`TOKEN_RECONCILE_MAX_AGE_MS` = 5m)
3. Sync Stream SQL evaluates `membership.status = 'active'` and known roles on every query. An inactive projection stops new rows immediately for the next evaluation.

## Worst-case online revocation

| Path                           | Bound                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| API Commands / Household reads | Immediate after webhook projection, or within 60s via reconcile-on-read if the webhook was missed.      |
| New PowerSync token            | Immediate after webhook, or within 5m via token-time reconcile if the webhook was missed.               |
| Existing PowerSync connection  | Until the current sync token expires. Tokens are issued with a **30-minute** TTL (`TOKEN_TTL_SECONDS`). |

**Worst-case online revocation for an already-connected sync client:** about **30 minutes** (remaining token lifetime) when webhooks are delayed or missed, plus up to **5 minutes** before the next token reconcile if the client refreshes just before expiry without a webhook. With timely webhooks, stream queries deny inactive Memberships on the next evaluation without waiting for token expiry.

Do not claim immediate global revocation from webhook delivery alone. An offline device cannot observe remote removal until it reconnects; confirmed removal then stops uploads and clears that Household's pending edits and cache on the device.

## Assumptions

- `WORKOS_WEBHOOK_SECRET` is configured in production so unsigned events are rejected.
- PowerSync continues to evaluate stream predicates against the live Membership projection, not a token-embedded role snapshot.
- Stale or reordered events cannot resurrect access past an inactive tombstone with a newer `observed_at`.
