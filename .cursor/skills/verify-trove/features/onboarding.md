# First-account onboarding

Onboarding lets a new user plant their first cash account (name, opening balance, style) and land on Home with that account available — no sign-in required.

## Sub-features

- `onboard-welcome` shows the garden welcome and **Plant your first seed**.
- `onboard-name` collects an account name (and type).
- `onboard-balance` collects an opening balance (empty amount = $0) and currency.
- `onboard-style` lets the user pick color/icon, then **Plant it**.
- `onboard-finish` celebrates and **Open Trove** routes to Home (optional **Back up & share with a household** starts auth — skip for local proof).
- `onboard-back` walks form steps backward via **Go back**.

## How to get to it (user POV)

- Fresh install / empty anonymous ledger: Home redirects to `/onboarding` (signed-in empty ledger does **not** redirect).
- After Settings → **Erase local data from this device** → confirm **Erase Everything**, onboarding returns (unavailable while synced).
- Deep link `trove://onboarding` when the app is installed.
- Basic flow clears state via Maestro `launchApp.clearState`.

## Driving it with stim + agent-device

Preconditions:

- Doctor passes on the stim-owned UDID.
- No cash accounts exist (otherwise Home will not redirect for anonymous users). Prefer `flows/01-onboarding.yaml` (`clearState: true`) or erase on the verify sim, then relaunch.
- Evidence dir `$VERIFY_TROVE_ARTIFACTS` exists.

Preferred: run the Maestro flow

```bash
agent-device test .cursor/skills/verify-trove/flows/01-onboarding.yaml \
  --maestro --platform ios --udid "$VERIFY_TROVE_UDID" \
  --metro-host 127.0.0.1 --metro-port "$VERIFY_TROVE_METRO_PORT" \
  --artifacts-dir "$VERIFY_TROVE_ARTIFACTS/flows"
```

Interactive recipe:

- **Confirm welcome.** `agent-device snapshot -i` — tree includes **Plant your first seed** / `id="onboarding-start"`. Save dump to `$VERIFY_TROVE_ARTIFACTS/onboarding-welcome.snapshot.txt`.
- **Start.** `press 'id="onboarding-start"' --settle`. `wait text "Name your first plot"` / wait `id="onboarding-name-input"`.
- **Name account.** `fill 'id="onboarding-name-input"' "Verify Checking" --settle`. Press `id="onboarding-continue"` (**Continue**).
- **Opening balance.** Await `id="onboarding-amount-input"`. Fill `100` (or leave empty = $0). Press continue.
- **Style + plant.** Await **Make it yours**. Press `id="onboarding-continue"` (**Plant it**). Await **Your garden is planted** / `id="onboarding-finish"`.
- **Open Trove.** Press `id="onboarding-finish"`. Do **not** press `onboarding-share-prompt`. Await Home chrome: `Create transaction`.
- **Proof.** Snapshot + screenshot → `$VERIFY_TROVE_ARTIFACTS/onboarding-home.*`. Second read: Settings → **Accounts** shows **Verify Checking**.

## Gotchas

- If any account already exists, `/` never shows welcome for anonymous users — erase or `clearState` first.
- Signed-in users with zero accounts skip the Home redirect — use deep link or erase only when erase is available.
- Form CTA label changes: **Continue** on name/balance, **Plant it** / **Planting…** on style.
- Celebration also offers household backup — leave it alone for local ledger proof.
- Completing onboarding without tapping **Open Trove** leaves the celebration screen — not yet Home.
- Erase is destructive; only use it on the stim-owned verify simulator.
