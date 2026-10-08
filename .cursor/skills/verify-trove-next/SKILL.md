---
name: verify-trove-next
description: >-
  Prove Trove Next (apps/mobile-next) on a simulator. Use when a screen, gesture,
  empty state, error state, auth flow, Home, Ledger, Market, or Household change
  needs a pass; when a visible bug needs a regression; or when a Maestro flow
  is being added or repaired.
---

# Verify Trove Next

Proof is a Maestro replay of a path just driven with Argent. The app is `apps/mobile-next` (Trove Next). Bundle id and Android package: `com.stringsaeed.moneymanagement.next`. Scheme: `trove-next://`.

Argent drives one simulator or emulator. Maestro replays the YAML. Jest covers logic, schemas, and transport. A screen, gesture, empty state, or error state is a flow.

Load the platform skill before the first drive: `argent-ios-simulator-setup` or `argent-android-emulator-setup`, then `argent-react-native-app-workflow`. Use `argent-test-ui-flow` and `argent-device-interact` for the drive. Install the Maestro CLI when `maestro` is missing, then replay.

Pick a device `list-devices` shows as free and keep the drive and the replay on it. These flows `launchApp` with `clearState`, so the device is a checkout simulator or emulator.

## Loop

Run this loop on the feature or bug being written. Later steps stay unfinished until the current one meets its bar.

### 1. Drive

Walk the path on the installed dev build. Read labels from the live tree (`describe`, `debugger-component-tree`) and from `accessibilityLabel`, `testID`, and visible text in `apps/mobile-next/src`.

Done when the latest Argent screenshot shows the outcome this change claims, including the error or empty state when that is the bug. The Expo dev launcher on screen means Metro is not attached: reconnect it and drive again.

### 2. Record

Write that path into `apps/mobile-next/e2e/maestro`. Extend the flow the change touches, or add a YAML file beside the suite it belongs to and tag it `main` or `core`. Copy labels from the tree you just saw. A new screen gets a stable `testID` or `accessibilityLabel` in the component when the visible text can collide.

Guest is the baseline (`subflows/launch-guest.yaml`). A signed-in path is a separate flow, added when the change needs a user session, with secrets supplied through Argent's secret placeholder.

Done when the YAML contains every action and assert from the drive, and the file is tagged.

### 3. Replay

From `apps/mobile-next`, with Metro up and the same device selected:

```bash
maestro test --device <udid-or-serial> e2e/maestro/<suite>/<flow>.yaml
```

Done when that command exits 0 on the YAML after the last edit. When replay fails, drive that screen again, change the YAML to the live label, and replay the file. The suite bar below starts over after that edit.

### 4. Suites

Replay the suites this change can affect, on iOS and on Android. One device at a time. `clearState` flows share one app id, so they stay sequential on that device.

```bash
pnpm maestro:main
pnpm maestro:core
```

Pass `--device` through the script (`pnpm maestro:main -- --device <id>`) when more than one device is connected.

| Suite | Tag | Proves |
| --- | --- | --- |
| `e2e/maestro/main/guest-home.yaml` | main | Guest session lands on Home |
| `e2e/maestro/main/tabs.yaml` | main | Home, Ledger, Market, Settings |
| `e2e/maestro/core/account-create.yaml` | core | Account create and list |
| `e2e/maestro/core/category-create.yaml` | core | Category create and list |
| `e2e/maestro/core/transaction-create.yaml` | core | Expense saved onto Home |
| `e2e/maestro/core/ledger-destinations.yaml` | core | Accounts, Categories, Recurring |
| `e2e/maestro/core/create-sheet.yaml` | core | Create sheet opens each editor |
| `e2e/maestro/core/settings-guest.yaml` | core | Profile and end guest session |
| `e2e/maestro/core/household-gate.yaml` | core | Guest household gate |

`pnpm maestro` reads `e2e/maestro/config.yaml`, which runs `main/` and `core/` only.

Done when `main` passes on iOS and Android, and every `core` flow this change can affect passes on both. Name a platform that has no device as open proof. When guest entry or Market stops on its in-app error copy, report that copy. That replay has failed.

Appearance and reduced motion are part of the same loop when the change touches them: drive the state, record it on the flow, replay it.

## Jest

Keep unit tests for logic, schemas, and transport under `__tests__`. `pnpm test` in `apps/mobile-next` runs those. Types, `pnpm lint:fix`, and `pnpm format` still run. Name any device or backend check that did not run.
