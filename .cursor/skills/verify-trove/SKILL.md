---
name: verify-trove
description: Drive the Trove Expo mobile app (iOS simulator primary) with Argent to prove user-facing behavior. Use when verifying onboarding, transactions, tabs, settings, accounts, or any UI change that needs real-device evidence.
---

# Verify Trove

Drive the real Trove app the way a user would. Capture evidence. Do not invent internal setters or test-only shortcuts as proof.

Primary surface: **iOS simulator** Expo/React Native app (`apps/mobile`, product name **Trove**). Secondary surfaces exist (Android emulator, `pnpm web`) but this skill standardizes on iOS + Argent. Web is not the verification surface unless a feature is web-only.

Bundle id / Android package: `com.stringsaeed.moneymanagement`  
URL scheme: `trove://`  
Dev display name: `Trove (Dev)` (default `APP_ENV`)

Harness: **Argent** (`@swmansion/argent`). Prefer MCP tools when connected; otherwise the same tools via CLI:

```bash
pnpm exec argent run <tool> -- <flags>
# or
./node_modules/.bin/argent run <tool> -- <flags>
```

Always load `argent-device-interact` (and `argent-ios-simulator-setup` / `argent-test-ui-flow` as needed) before driving.

## Isolate

- Prefer a **dedicated verify simulator**. Default UDID when unset: `D1509E32-FDCD-4788-93A3-DB775B256CFA` (iPhone 17). Override with `VERIFY_TROVE_UDID`.
- **Never double-drive** the same UDID. If another agent or human owns the device, stop and report — shared SQLite ledger data will corrupt both sessions.
- Two simulators can run side by side (different UDIDs). Do not share Metro ports when proving Android in parallel; iOS simulators share host Metro `:8081` (one Metro is fine for multiple iOS sims).
- Local ledger data lives on-device. A clean slate = Settings → **Erase All Data**, or `reinstall-app` after a fresh install. Do not erase the user's personal simulator without asking.

## Launch

Record the run id and evidence dir first:

```bash
export VERIFY_TROVE_RUN_ID="${VERIFY_TROVE_RUN_ID:-$(date +%Y%m%d-%H%M%S)}"
export VERIFY_TROVE_ARTIFACTS=".cursor/skills/verify-trove/artifacts/${VERIFY_TROVE_RUN_ID}"
mkdir -p "$VERIFY_TROVE_ARTIFACTS"
```

Start (or attach) via the helper:

```bash
.cursor/skills/verify-trove/scripts/launch.sh
```

What it does:

1. Boots `VERIFY_TROVE_UDID` if not booted (`argent run boot-device --udid …`).
2. Starts Metro from repo root with `pnpm start` only when nothing already owns `:8081`.
3. Installs/runs with a **local** native compile when the binary is missing or `VERIFY_TROVE_FORCE_BUILD=1`.
   `expo run:ios --device … --no-build-cache --no-bundler` alone is **not** enough: `buildCacheProvider: "eas"` still downloads a fingerprint-matched remote `.app` (seen as `Cannot find native module 'ExpoSecureStore'` → “authorized ledger could not load”).
   The launch helper temporarily stashes `apps/mobile/eas.json` for that compile only (restored before exit) so EAS remote resolve is skipped, then builds with Xcode. A copy is kept at `$VERIFY_TROVE_ARTIFACTS/eas.json.verify-bak`.
4. Otherwise `launch-app` for `com.stringsaeed.moneymanagement`, then `open-url` the **dev-client** deep link:
   `trove://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081`
   Never use bare `exp://…` — that opens Expo Go and fails on this project.

Ready when:

- `curl -sf http://127.0.0.1:8081/status` succeeds (Metro packager up, started with `expo start --dev-client`).
- `describe` shows **app** chrome (`Plant your first seed`, `Create transaction`, `Erase All Data`, …) — **not** the Expo dev-client launcher (`Searching for development servers…`) and **not** Expo Go errors. If still on the launcher, `open-url` `trove://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081` (never bare `exp://`).

Write `udid`, `run_id`, and whether this run started Metro / booted the sim into `$VERIFY_TROVE_ARTIFACTS/launch.json` (the helper does this).

## Doctor

Read-only health check. Run before every drive, and again whenever anything looks off:

```bash
.cursor/skills/verify-trove/scripts/doctor.sh
```

Pass criteria (all required):

1. Argent tool-server healthy (`argent server status` → health ok).
2. Target UDID listed as booted in `list-devices`.
3. Port `8081` is Metro (not some other listener). Prefer `debugger-status`; accept `connected` or `not_connected` with reason `no_app_connected`.
4. `launch-app` for `com.stringsaeed.moneymanagement` succeeds (app installed).
5. `describe` returns Trove **app** chrome (`Plant your first seed` / `Create transaction` / …). Fail if the Expo launcher (`Searching for development servers`) is showing.

Fail closed: do not drive if doctor fails.

## Drive

1. Read `.cursor/skills/verify-trove/features/README.md`, then the feature file for the behavior under proof.
2. Prefer Argent `describe` / `await-ui-element` / `debugger-component-tree` over screenshot coordinates.
3. Stable handles from this app (use these literally):

| Handle | Kind | Where |
| --- | --- | --- |
| `onboarding-start` | testID | Welcome CTA **Plant your first seed** |
| `onboarding-name-input` | testID | Account name field |
| `onboarding-amount-input` | testID | Opening balance field |
| `onboarding-continue` | testID | Form CTA (**Continue** / **Plant it**) |
| `onboarding-back` | testID / label `Go back` | Form back |
| `onboarding-finish` | testID | Complete CTA **Open Trove** |
| `Create transaction` | accessibilityLabel | Floating + button → `/transaction/new` |
| `Ledger` | accessibilityLabel | Tab |
| `Inbox` | accessibilityLabel | Tab |
| `Envelopes` | accessibilityLabel | Tab |
| `Settings` | accessibilityLabel | Tab |
| `Accounts` | accessibilityLabel | Settings row → `/accounts` |
| `Categories` | accessibilityLabel | Settings row |
| `Recurring Rules` | accessibilityLabel | Settings row |
| `Erase All Data` | visible text | Settings danger zone |
| header `save` | native header label | Transaction save (checkmark) |

Home tab title is intentionally empty (`""`) — do **not** look for an accessibility label `Home`. Reach home with `open-url` `trove:///` or by finishing onboarding / tapping the house icon via `debugger-component-tree`.

Money Movement tab is feature-flagged (`enable-money-movement` via PostHog) and may be absent — do not fail doctor for that.

Deep links (scheme `trove://`) are valid entry shortcuts after the app is installed; still prove the resulting UI with `describe` / screenshot.

Tap formula from `describe` frames: `x = frame.x + frame.width/2`, `y = frame.y + frame.height/2`, then `gesture-tap`.

## Evidence

Proof root: `.cursor/skills/verify-trove/artifacts/<run-id>/` (never delete during cleanup).

Minimum per feature proof:

1. **Action evidence** — `describe` dump or AX snapshot **before** and **after** the key user action (`*-before.txt`, `*-after.txt`).
2. **Visual evidence** — `screenshot` PNG at the resulting state (`*-after.png`). Prefer `scale: 1.0` with `includeImageInContext: false` when saving baselines.
3. **Side effect** — for mutations, a second user-facing read (e.g. reopen Home / Accounts / transaction list) that shows the stored value. Saving alone is not enough.
4. **Identity** — note `feature_id`, entry point, UDID, and bundle id in `$VERIFY_TROVE_ARTIFACTS/proof.md`.

Standards:

- Exercise the real user path (onboarding CTA, tab bar, Create transaction), not SQLite seeds or debugger-only writes, unless the feature map explicitly allows a seed for preconditions.
- Mocks only at production boundaries already isolated (e.g. market quote API keys); ledger writes must hit the real on-device DB.
- Report unreachable entry points with the attempted command and unmet precondition — do not claim another path verified them.

## Cleanup

```bash
.cursor/skills/verify-trove/scripts/cleanup.sh
```

Cleanup rules:

- Terminate only the Trove app on the verify UDID (`restart-app` terminate path / relaunch not required). Prefer stopping what **this run** started.
- If `launch.sh` started Metro, stop it with `argent run stop-metro` (or the PID recorded in `launch.json`) — never `killall node`.
- If `launch.sh` booted the simulator and `VERIFY_TROVE_SHUTDOWN_SIM=1`, shut that UDID down. Default: leave the sim booted.
- **Never** delete `$VERIFY_TROVE_ARTIFACTS`. Confirm proof files still exist after cleanup.
- Do not erase ledger data unless the feature recipe's fixture cleanup says so, and never wipe a non-verify simulator.

## Helpers

All executable under `.cursor/skills/verify-trove/scripts/`:

| Script | Invocation | Purpose |
| --- | --- | --- |
| `doctor.sh` | `.cursor/skills/verify-trove/scripts/doctor.sh` | Read-only readiness |
| `launch.sh` | `.cursor/skills/verify-trove/scripts/launch.sh` | Boot + Metro + app |
| `cleanup.sh` | `.cursor/skills/verify-trove/scripts/cleanup.sh` | Tear down run-owned processes |

Shared env (optional):

- `VERIFY_TROVE_UDID`
- `VERIFY_TROVE_RUN_ID`
- `VERIFY_TROVE_FORCE_BUILD=1`
- `VERIFY_TROVE_SHUTDOWN_SIM=1`
- `VERIFY_TROVE_ARTIFACTS` (override evidence root)

## Feature map

See [features/README.md](./features/README.md). Pick one feature file per proof. Expand the map with `/maintain-verification-skill` as the product changes.
