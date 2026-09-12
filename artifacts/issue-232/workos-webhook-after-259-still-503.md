# WorkOS webhook still 503 after #259 (Relates #232)

Relates to #232 only. **Never** Closes/Fixes #232 or parent #224.
Not a certification PASS. No secret values recorded. No deploy-workflow code-fix PR opened.

## What changed

| Event | Detail |
| --- | --- |
| [#259](https://github.com/Stringsaeed/money-management/pull/259) | **MERGED** `2026-09-12T19:15:11Z` → `c1adeb4` on `main` — wires `WORKOS_WEBHOOK_SECRET` through Deploy Worker / cutover preflight |
| Deploy Worker | Run [34713619532](https://github.com/Stringsaeed/money-management/actions/runs/34713619532) after merge → **failure** |
| Failure class | **Actions billing / spending limit** — **not** a workflow/code defect; **not** a missing-secret preflight failure (job never started) |
| [#232](https://github.com/Stringsaeed/money-management/issues/232) | Falsely closed by #259 merge keywords; **reopened** (`state=open`, `state_reason=reopened`) |

## Deploy Worker run 34713619532

| Field | Value |
| --- | --- |
| Conclusion | **failure** |
| Job | Alchemy deploy |
| Steps executed | **0** |
| Runner | none (`runner_name` empty) |
| Billable | `UBUNTU total_ms=0` |
| Wall clock | ~5s (`2026-09-12T19:15:13Z`–`19:15:18Z`) |
| Annotation (owner-confirmed) | `job was not started because recent account payments have failed or your spending limit needs to be increased` |

**Hard-stop:** do **not** open a separate Relates deploy-workflow code-fix PR. Billing must be cleared by the owner before Deploy Worker can run and export `WORKOS_WEBHOOK_SECRET` to prod.

## Live re-probe (`2026-09-12T19:23:27Z`)

| Request | Result |
| --- | --- |
| `GET https://auth.trove.ing/` | **200** `OK` |
| `POST https://auth.trove.ing/webhooks/workos` (empty JSON `{}`, no signature) | **503** |

Exact body: `Webhook receiver is disabled: WORKOS_WEBHOOK_SECRET is not configured.`

Raw transcript: `workos-webhook-probe-2026-09-12T192327Z.txt`.

## Verdict

**BLOCKED** (unchanged). #259 wiring is on `main`, but Actions billing prevented redeploy, so `WORKOS_WEBHOOK_SECRET` **never reached prod**. Live receiver still disabled until owner:

1. Clears GitHub Actions billing / spending-limit block.
2. Ensures repo secret `WORKOS_WEBHOOK_SECRET` is set (WorkOS Dashboard signing secret for `we_01M2945R34XC28KTEABF24F4CD` — value **not** invented or recorded here).
3. Re-runs Deploy Worker successfully.
4. Confirms `POST /webhooks/workos` without a valid signature returns **400/401**, not **503**.

Matrix remains incomplete. Do not merge #241 as certified.
