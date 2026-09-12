# Anonymous / local-only iOS device evidence (Relates #232)

**Status:** `PASS` for anonymous local-only use on iPhone 17 Pro  
**Not:** Create Account / NativeButton / `/account/new` (skipped)  
**Not:** live Household create / sign-out (requires signed-in session)

## Revision / device

| Field | Value |
| --- | --- |
| Capture revision | `50e8dfcc9c0dcd3d79c674b956cb78131f701072` (running app tip at capture) |
| Cert branch tip before this stamp | `ad7cf561cb17b49091e5056d8bf483f3d9498fc6` |
| Device | iPhone 17 Pro simulator (`6E4BBB8A-790E-4DDD-995B-6A3D1D9101DB`) |
| Bundle | `com.stringsaeed.moneymanagement` (Trove Dev) |
| Tooling | `agent-device` only (argent unused) |
| Captured | `2026-09-12T19:30:34Z` |

## What was proven

1. App opens without sign-in → Accounts empty state (`anonymous-01-accounts-empty.png`).
2. Home tab usable locally: `$0.00`, Upcoming payments empty, Recent Journal (`anonymous-02-home.png`). **Create account FAB visible but never pressed.**
3. Bottom-tab **Settings** (not Expo Dev Menu gear) loads Profile / Manage / Stats (`anonymous-03-settings.png`).
4. **Profile & household** opens signed-out AuthKit sheet: "Sign in with email code"; copy states local ledger stays on device and sign-in does not create a Household (`anonymous-04-signed-out-auth-sheet.png`, `anonymous-profile-sheet.txt`).
5. **Cancel** returns to Settings without AuthKit OTP (`anonymous-cancel-sheet.txt`) — mirrors prior cancel PASS; keeps session anonymous.
6. Envelopes tab local empty state (`anonymous-05-envelopes.png`); Accounts via Settings Manage path (`anonymous-06-accounts-via-settings.png`).

## Explicit non-claims / BLOCKED

| Row / sub-criterion | Status | Why |
| --- | --- | --- |
| Live Household create / switch / invite | `BLOCKED` | No signed-in session; OTP AX blocked historically; `CERT_USER_*` ABSENT |
| Restart retains session | `BLOCKED` | No signed-in session to retain |
| Sync-or-discard sign-out (live) | `BLOCKED` | No signed-in session |
| Dual-token live isolation | `BLOCKED` | `CERT_USER_A_TOKEN` / `CERT_USER_B_TOKEN` ABSENT |
| PowerSync mint / removal bound | `BLOCKED` | `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID` ABSENT |
| Create Account hit-test | skipped | Owner-owned NativeButton / #258–#265 class |

Hard-stop file: `cert-user-powersync-hardstop-2026-09-12.txt`

## Governance

Relates to #232 only on cert PR #241. Does **not** Closes/Fixes #232 or #224. Parent #224 stays open.
