# Settings and accounts

Settings exposes profile/household entry, management links (Accounts, Categories, Recurring Rules, Activity Timeline), stats, and a destructive erase path. Accounts lists cash accounts and supports adding/editing via sheets.

## Sub-features

- `settings-open` opens the Settings tab.
- `settings-accounts` navigates to the Accounts list.
- `settings-categories` navigates to Categories.
- `settings-recurring` navigates to Recurring Rules.
- `settings-erase` shows the erase confirmation (do not confirm on shared sims).
- `accounts-list` shows named account rows after onboarding.

## How to get to it (user POV)

- Tap **Settings** in the tab bar.
- Deep link `trove://settings` or `trove://accounts`.
- From onboarding complete, optional **Back up & share with a household**.

## Driving it with stim + agent-device

Preconditions:

- Doctor passes.
- At least one account named distinctly (e.g. from onboarding **Verify Checking**) unless testing empty Accounts.

Preferred: `flows/04-settings-accounts.yaml`.

Interactive recipe:

- **Open Settings.** Press `role=button label="Settings"`. Await **Accounts**, **Categories**. Scroll to **Erase local data from this device**. Save `settings-open.*`.
- **Open Accounts.** Press Manage-row `role=button label="Accounts"` (not the stats row). Await account row matching the seeded name. Save `settings-accounts.*`.
- **Return.** Press `role=button label="(tabs)"` (stack back — not the Settings tab). Confirm Settings chrome returns.
- **Erase affordance (non-destructive proof).** Scroll to Danger Zone. Press the erase cell (AX label may append the subtitle). Await alert **Erase All Data** / **Erase Everything**, then **Cancel**. Save `settings-erase-cancel.*`. Do **not** confirm erase unless the run intentionally resets the verify simulator.

## Gotchas

- Visible erase copy is **Erase local data from this device**; **Erase All Data** is the alert title only.
- Stats rows (**Total Transactions**, etc.) are non-navigating (`noChevron`) — tapping them is not a bug if nothing opens.
- **Erase Everything** wipes the verify ledger and returns toward onboarding — only on the stim-owned UDID. While synced, the control stays visible but presses are a no-op.
- Activity row label is **Activity Timeline**.
- Profile & household sign-in needs the backend (`EXPO_PUBLIC_SERVER_URL`, default `http://localhost:3000`); local ledger features do not.
- Account FAB (+) opens a bottom sheet — dismiss before asserting list state.
- Account row tap opens an edit sheet, not `/account/[id]`.
