# PowerSync removal + disposable reset — env hard-stop BLOCKED (Relates #232)

Relates to #232 only. **Never** Closes/Fixes #232 or parent #224.
Hard-stop: required env **names** absent locally. Values never recorded.

## Verdict

| Capability | Status | Missing env names (only) |
| --- | --- | --- |
| Live PowerSync JWT mint / connection removal bound (row 6) | **BLOCKED** | `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID` |
| Local disposable DB mint / reset (row 8) | **BLOCKED** | `PLANETSCALE_HOST`, `PLANETSCALE_DATABASE`, `PLANETSCALE_USER`, `PLANETSCALE_PASSWORD` (or `DATABASE_URL`) |
| Disposable env reset performed by #231/#240 | **SKIPPED** (predecessor) | Reset was not run — cannot claim clean-start after reset |
| Offline-device PowerSync removal observation | **BLOCKED** | Needs device + live mint (same PowerSync names) |

Reconfirm this write (2026-09-12T05:47Z): all names above still **ABSENT** in local process / `.env*` search. Also absent (unrelated dual-identity): `CERT_USER_A_TOKEN`, `CERT_USER_B_TOKEN`. Prod webhook still separate: `WORKOS_WEBHOOK_SECRET` empty on `auth.trove.ing` → **503**.

## What still PASSes elsewhere (not this hard-stop)

- PowerSync **stream config** automated suite `test-powersync-proper.txt` **9/9** (not a live removal bound)
- Event duplicate/reorder/miss projection seams (row 6 API) remain PASS from prior captures
- Live API health `https://auth.trove.ing` **200 OK**

## Governance

- Relates to #232 only. Parent #224 stays open.
- Do **not** claim row 6 live removal or row 8 clean setup PASS.
- Do **not** merge PR #241 as certified.
