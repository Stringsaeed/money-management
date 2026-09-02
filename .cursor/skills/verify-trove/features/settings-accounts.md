# Settings and accounts

Settings exposes profile/household entry, management links (Accounts, Categories, Recurring Rules, Activity), stats, and a destructive **Erase All Data** path. Accounts lists cash accounts and supports adding/editing.

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

## Driving it with Argent

Preconditions:

- Doctor passes.
- At least one account named distinctly (e.g. from onboarding **Verify Checking**) unless testing empty Accounts.

- **Open Settings.** Tap **Settings**. Await rows **Accounts**, **Categories**, **Erase All Data**. Save `settings-open.describe.txt` + `.png`.
- **Open Accounts.** Tap accessibility label **Accounts**. Await account row matching the seeded name (aria-label = account name). Save `settings-accounts.describe.txt` + `.png`.
- **Return.** Hardware/back or navigate to Settings again; confirm Settings chrome returns.
- **Erase affordance (non-destructive proof).** Tap **Erase All Data** only far enough to see the system alert titles **Erase All Data** / **Erase Everything**, then choose **Cancel**. Save `settings-erase-cancel.describe.txt`. Do **not** confirm erase unless the run intentionally resets the verify simulator.

## Gotchas

- Stats rows (**Total Transactions**, etc.) are non-navigating (`noChevron`) — tapping them is not a bug if nothing opens.
- **Erase Everything** wipes the verify ledger and returns the user toward onboarding — only on the dedicated UDID.
- Profile & household sign-in needs the backend (`EXPO_PUBLIC_SERVER_URL`, default `http://localhost:3000`); local ledger features do not.
- Account FAB (+) opens a bottom sheet — dismiss before asserting list state.
