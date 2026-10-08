---
name: verify-trove-next
description: >-
  Prove Trove Next in apps/mobile-next on a simulator with Argent flows. Use
  when a screen, gesture, empty state, error state, auth, Home, Ledger, Market,
  or Household change lands in apps/mobile-next, when a visible bug needs a
  regression, or when recording or repairing an Argent flow.
---

# Verify Trove Next

Trove Next is the `apps/mobile-next` workspace. The bundle id and the Android package are `com.stringsaeed.moneymanagement.next`. The scheme is `trove-next://`. The display name is Trove Next.

Proof is an Argent flow recorded on a simulator and then replayed. Jest stays on logic, schemas, and transport under `__tests__`. A screen, gesture, empty state, or error state is an Argent flow.

## Skills

Load these skills from `.claude/skills/` and follow them.

1. `argent-ios-simulator-setup` or `argent-android-emulator-setup`, for the device.
2. `argent-react-native-app-workflow`, for the dev build.
3. `argent-test-ui-flow` and `argent-device-interact`, for the live drive.
4. `argent-create-flow`, for the recording. Read its `references/flow-yaml.md` when polishing a flow.
5. `argent-qa-flows`, for the saved-regression contract.

## Loop

Run this loop on the feature or bug being written. Start the next step when the current step's criterion is met.

### 1. Drive

Drive the path with `argent-test-ui-flow` and `argent-device-interact` until a screenshot shows the outcome this change claims. Include the empty state or the error state when that outcome is the claim. Reconnect Metro and drive again when the screenshot shows the Expo dev launcher. When JavaScript loads, the dev client closes the Expo dev menu. On iOS it also turns off the shake gesture, the three-finger long press, and the floating button. Reload Metro when a screenshot still shows that menu, then drive again.

Done when the latest Argent screenshot shows that outcome inside the app, with Metro attached.

### 2. Record

Record that path with `argent-create-flow`. Start the recorder before the first launch or in-app action. The first walkthrough is the recording. Record each check when that state is on screen.

Pass the absolute path of `apps/mobile-next` as `project_root` on every recording call. Flows are the YAML files in `apps/mobile-next/.argent/flows/`. The folder name starts with a dot, so show hidden files if the tree looks empty.

Name the flow `qa-<area>-<behavior>`.

Guest is the baseline. Record **Continue as guest** when the sign-in screen is up.

Record a signed-in WorkOS flow only when the change needs a user session. Keep it separate from the guest flow. Store external values as `{{secret:NAME}}`. The placeholder resolution order is in `argent-create-flow` `references/flow-yaml.md`.

`launch:` restarts the process and leaves app data, account data, and backend data in place. The rule is in `argent-create-flow` `references/flow-yaml.md`. A repeated run stays on the session already stored on the device until a recorded setup step changes it. When a guest session is already stored, record **End guest session** and then **Continue as guest** as that setup, at the moment those controls are on screen. `argent-qa-flows` reaches a separate reset or seed only through a recorded flow and `run:`. Pass 2 runs the same YAML immediately. Leave app data and account data untouched between the two passes.

Done when the guest flow file exists at that path, its setup reaches **Continue as guest** or **End guest session** and then **Continue as guest**, and its scenario checks were recorded while each state was on screen. A signed-in flow is done when its own file exists beside the guest flow and its checks were recorded while each state was on screen.

### 3. Replay

Replay from `apps/mobile-next`. A bare name resolves `.argent/flows/<name>.yaml` from the current directory.

```bash
argent flow run <name> --platform ios --device <udid>
argent flow run <name> --platform android --device <udid>
```

Done when the flow meets the `argent-qa-flows` completion gate. Completion is two consecutive passes of the unchanged YAML on the same runner, counted only after the last edit, with pass 2 immediately after pass 1. On failure, repair the step from the live tree and keep the check. Any edit starts the two passes over.

### 4. Include the flow

The flow for this feature or bug is part of the change.

When the change can affect a surface below, include that flow in the same change. Record it under the name in the table when the file is absent. Replay it on iOS and on Android.

| Flow | Proves |
| --- | --- |
| `qa-home-guest` | Guest lands on Home |
| `qa-tabs-switch` | Home, Ledger, Market, and Settings |
| `qa-ledger-account-create` | Account create |
| `qa-ledger-category-create` | Category create |
| `qa-ledger-expense-create` | Expense create |
| `qa-ledger-destinations` | Accounts, categories, and recurring |
| `qa-ledger-create-sheet` | Create sheet opens each editor |
| `qa-settings-end-guest` | End guest session |
| `qa-household-guest-gate` | Guest household gate, Sign in to share |

A feature or bug that is not in the table still gets its own `qa-<area>-<behavior>` flow.

Done when every affected flow has two consecutive passes on iOS and on Android. When a platform has no device, name that platform as open proof.
