---
name: verify-trove
description: Drive the Trove Expo mobile app (iOS simulator primary) with stim + agent-device to prove user-facing behavior. Use when verifying onboarding, transactions, tabs, settings, accounts, envelopes, or any UI change that needs real-device evidence.
---

# Verify Trove

Drive the real Trove app the way a user would. Capture evidence. Do not invent internal setters or test-only shortcuts as proof.

Primary surface: **iOS simulator** Expo/React Native app (`apps/mobile`, product name **Trove**). Secondary surfaces exist (Android emulator, `pnpm web`) but this skill standardizes on iOS. Web is not the verification surface unless a feature is web-only.

Bundle id / Android package: `com.stringsaeed.moneymanagement`  
URL scheme: `trove://`  
Dev display name: `Trove (Dev)` (default `APP_ENV`)

## Harness

Two tools, one job each:

| Tool | Role |
| --- | --- |
| **stim** | Own the workspace simulator, Metro, install, and launch (`stim start` → `stim ios` from `apps/mobile`). Load `stim guide agent` when unsure. |
| **agent-device** | Drive UI (snapshot / press / fill / wait), capture screenshots, and run Maestro flows (`agent-device … --maestro`). Load the `agent-device` skill; prefer `agent-device help manual-qa` / `help react-native`. |

Do **not** use Argent for verify-trove. Prefer the helpers below over hand-rolled `expo run:ios`.

Always run stim from `apps/mobile` (the package that depends on Expo). Never point stim at a human-created simulator — it owns `stim-mobile (…)`.

## Isolate

- Prefer the **stim-owned** simulator for this checkout (`stim status` → `ios.udid`). Override only with `VERIFY_TROVE_UDID` when you must bind agent-device to that exact device.
- **Never double-drive** the same UDID. If another agent or human owns the device, stop and report — shared SQLite ledger data will corrupt both sessions.
- Parallel worktrees each get their own stim Metro port + owned sim. Do not share those across agents.
- Local ledger data lives on-device. A clean slate = Maestro `launchApp.clearState` (see `flows/01-onboarding.yaml`), Settings → **Erase local data from this device** (confirm **Erase Everything**), or reinstall. Do not erase a non-verify / non-stim simulator without asking.

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

1. `stim start --json` from `apps/mobile` (idempotent Metro supervisor on the workspace port).
2. `stim ios --json` — builds/restores, installs, launches on the **owned** stim simulator, wires Metro. Pass `VERIFY_TROVE_FORCE_BUILD=1` to add `--no-build-cache`.
3. Opens an **agent-device** session (`--session verify-trove`) bound to that UDID + Metro port and waits for Trove chrome (not the Expo launcher).

Ready when:

- `curl -sf http://127.0.0.1:<metroPort>/status` succeeds (port from `launch.json` / stim facts — not always `8081` in parallel worktrees).
- `agent-device snapshot -i --session verify-trove` shows **app** chrome (`Plant your first seed`, `Create transaction`, `Erase local data from this device`, `No currency workspace yet`, …) — **not** `Searching for development servers…` and **not** Expo Go errors.

Write `udid`, `metro_port`, `run_id`, and whether this run started Metro into `$VERIFY_TROVE_ARTIFACTS/launch.json` (the helper does this). Trust stim's printed `udid` / `metroPort` — never assume a sim named “booted”.

## Doctor

Read-only health check. Run before every drive, and again whenever anything looks off:

```bash
.cursor/skills/verify-trove/scripts/doctor.sh
```

Pass criteria (all required):

1. `stim` and `agent-device` on PATH.
2. Target UDID resolved (launch.json or stim status for this `apps/mobile`) and booted.
3. Metro `/status` healthy on the workspace port.
4. `agent-device open` for `com.stringsaeed.moneymanagement` succeeds.
5. Snapshot shows Trove **app** chrome. Fail if the Expo launcher is showing.

Fail closed: do not drive if doctor fails. A doctor failure caused by skill/harness drift is drift — fix under this directory and retry once.

## Drive

1. Read `.cursor/skills/verify-trove/features/README.md`, then the feature file for the behavior under proof.
2. Prefer **basic Maestro flows** under `.cursor/skills/verify-trove/flows/` for the baseline suite:

```bash
.cursor/skills/verify-trove/scripts/run-flows.sh
```

   Or one flow:

```bash
agent-device test .cursor/skills/verify-trove/flows/01-onboarding.yaml \
  --maestro --platform ios --udid "$VERIFY_TROVE_UDID" \
  --metro-host 127.0.0.1 --metro-port "$VERIFY_TROVE_METRO_PORT" \
  --artifacts-dir "$VERIFY_TROVE_ARTIFACTS/flows"
```

   Use `--udid` (stim fact), not `--device` — stim clones share the display name `stim-mobile (iPhone 17 26.5)`.

3. For interactive / exploratory proof, use agent-device directly (after launch):

```bash
agent-device open com.stringsaeed.moneymanagement --platform ios --udid "$VERIFY_TROVE_UDID" \
  --session verify-trove --metro-host 127.0.0.1 --metro-port "$VERIFY_TROVE_METRO_PORT" --foreground
agent-device snapshot -i --session verify-trove
agent-device press 'id="onboarding-start"' --settle --session verify-trove
agent-device wait text "Name your first plot" --session verify-trove
agent-device screenshot --session verify-trove --out "$VERIFY_TROVE_ARTIFACTS/step.png"
agent-device close --session verify-trove
```

4. Prefer durable selectors (`id=…`, `label=…`) over coordinates. Copy `@refs` byte-for-byte from the latest snapshot when using refs.
5. Stable handles from this app:

| Handle | Kind | Where |
| --- | --- | --- |
| `onboarding-start` | testID | Welcome CTA **Plant your first seed** |
| `onboarding-name-input` | testID | Account name field |
| `onboarding-amount-input` | testID | Opening balance field |
| `onboarding-continue` | testID | Form CTA (**Continue** / **Plant it**) |
| `onboarding-back` | testID / label `Go back` | Form back |
| `onboarding-finish` | testID | Complete CTA **Open Trove** |
| `transaction-note-field` | testID | Note field (`Add a note...` / label `Transaction note`) |
| `Create transaction` | accessibilityLabel | Floating + button → `/transaction/new` |
| `Ledger` | accessibilityLabel | Tab |
| `Inbox` | accessibilityLabel | Tab |
| `Envelopes` | accessibilityLabel | Tab |
| `Settings` | accessibilityLabel | Tab |
| `Accounts` | accessibilityLabel | Settings Manage row → `/accounts` |
| `Categories` | accessibilityLabel | Settings row |
| `Recurring Rules` | accessibilityLabel | Settings row |
| `Activity Timeline` | accessibilityLabel | Settings row |
| `Erase local data from this device` | visible text | Settings danger zone (alert title **Erase All Data**) |
| `Set up Envelopes` | accessibilityLabel | Envelopes empty-state CTA → `/envelopes/setup` |
| header `save` | native header label | Transaction save (checkmark) |

Home tab title is intentionally empty (`""`) — do **not** look for an accessibility label `Home`. Reach home with `openLink: trove:///` / `agent-device open trove:///` or by finishing onboarding.

Money Movement tab is feature-flagged (`enable-money-movement` via PostHog) and may be absent — do not fail doctor for that.

Deep links (scheme `trove://`) are valid entry shortcuts after the app is installed; still prove the resulting UI with snapshot / screenshot / Maestro asserts.

## Evidence

Proof root: `.cursor/skills/verify-trove/artifacts/<run-id>/` (never delete during cleanup).

Minimum per feature proof:

1. **Action evidence** — snapshot / Maestro assert **before** and **after** the key user action (flow screenshots or `*-before.txt` / `*-after.txt`).
2. **Visual evidence** — screenshot PNG at the resulting state.
3. **Side effect** — for mutations, a second user-facing read (Home / Accounts / transaction detail) that shows the stored value. Saving alone is not enough.
4. **Identity** — note `feature_id`, entry point, UDID, Metro port, and bundle id in `$VERIFY_TROVE_ARTIFACTS/proof.md`.
5. After drives: `stim logs --errors` from `apps/mobile` (exit 0 **and** no matching errors). Empty query ≠ capture succeeded.

Standards:

- Exercise the real user path (onboarding CTA, tab bar, Create transaction), not SQLite seeds or debugger-only writes, unless the feature map explicitly allows a seed for preconditions.
- Mocks only at production boundaries already isolated; ledger writes must hit the real on-device DB.
- Report unreachable entry points with the attempted command and unmet precondition — do not claim another path verified them.

## Cleanup

```bash
.cursor/skills/verify-trove/scripts/cleanup.sh
```

Cleanup rules:

- `agent-device close --session verify-trove`.
- Terminate only the Trove app on the verify UDID.
- If `launch.sh` started Metro **and** `VERIFY_TROVE_SHUTDOWN_SIM=1`, run `stim stop` from `apps/mobile` (stops Metro + owned sim). Default: leave stim running for reuse.
- **Never** delete `$VERIFY_TROVE_ARTIFACTS`. Confirm proof files still exist after cleanup.
- Do not erase ledger data unless the feature recipe's fixture cleanup says so.

## Helpers

All executable under `.cursor/skills/verify-trove/scripts/`:

| Script | Invocation | Purpose |
| --- | --- | --- |
| `doctor.sh` | `.cursor/skills/verify-trove/scripts/doctor.sh` | Read-only readiness (stim + agent-device) |
| `launch.sh` | `.cursor/skills/verify-trove/scripts/launch.sh` | stim start/ios + agent-device open |
| `run-flows.sh` | `.cursor/skills/verify-trove/scripts/run-flows.sh` | Doctor + ordered basic Maestro suite |
| `cleanup.sh` | `.cursor/skills/verify-trove/scripts/cleanup.sh` | Close session / tear down run-owned processes |

Basic flows (Maestro YAML, agent-device `--maestro`): `.cursor/skills/verify-trove/flows/01-onboarding.yaml` … `05-envelopes.yaml`.

Shared env (optional):

- `VERIFY_TROVE_UDID` — override stim-resolved device
- `VERIFY_TROVE_METRO_PORT` — override stim Metro port
- `VERIFY_TROVE_RUN_ID` / `VERIFY_TROVE_ARTIFACTS`
- `VERIFY_TROVE_FORCE_BUILD=1` — `stim ios --no-build-cache`
- `VERIFY_TROVE_SHUTDOWN_SIM=1` — allow `stim stop` in cleanup
- `VERIFY_TROVE_SESSION` — agent-device session name (default `verify-trove`)

## Feature map

See [features/README.md](./features/README.md). Pick one feature file per proof, or run the basic flow suite. Expand the map with `/maintain-verification-skill` as the product changes.
