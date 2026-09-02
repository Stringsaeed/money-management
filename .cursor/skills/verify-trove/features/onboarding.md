# First-account onboarding

Onboarding lets a new user plant their first cash account (name, opening balance, style) and land on Home with that account available — no sign-in required.

## Sub-features

- `onboard-welcome` shows the garden welcome and **Plant your first seed**.
- `onboard-name` collects an account name (and type).
- `onboard-balance` collects an opening balance.
- `onboard-style` lets the user pick color/icon, then **Plant it**.
- `onboard-finish` celebrates and **Open Trove** routes to Home.
- `onboard-back` walks form steps backward via **Go back**.

## How to get to it (user POV)

- Fresh install / empty ledger: Home redirects to `/onboarding`.
- After **Erase All Data** in Settings, relaunch — onboarding returns.
- Deep link `trove://onboarding` when the app is installed.

## Driving it with Argent

Preconditions:

- Doctor passes on the verify UDID.
- No cash accounts exist (otherwise Home will not redirect). If accounts exist, either use Settings → **Erase All Data** (confirm the destructive alert) or reinstall, then relaunch.
- Evidence dir `$VERIFY_TROVE_ARTIFACTS` exists.

- **Confirm welcome.** Run `argent run describe --udid $VERIFY_TROVE_UDID`. Tree includes **Plant your first seed** / `onboarding-start`. Save dump to `$VERIFY_TROVE_ARTIFACTS/onboarding-welcome.describe.txt`.
- **Start.** Tap `onboarding-start` (via `describe` frame center or `debugger-component-tree`). Run `argent run await-ui-element` waiting for visible text **Name your first plot** or testID `onboarding-name-input`.
- **Name account.** Tap `onboarding-name-input`, then `argent run keyboard --udid $VERIFY_TROVE_UDID --text "Verify Checking"`. Tap **Continue** (`onboarding-continue`).
- **Opening balance.** Await `onboarding-amount-input`. Tap it, type `100`. Tap **Continue**.
- **Style + plant.** On the style step, tap **Plant it** (`onboarding-continue`). Await text **Your garden is planted** / `onboarding-finish`.
- **Open Trove.** Tap `onboarding-finish`. Await Home chrome: `Create transaction` and/or balance hero (not the welcome CTA).
- **Proof.** `argent run describe --udid $VERIFY_TROVE_UDID` → `$VERIFY_TROVE_ARTIFACTS/onboarding-home.describe.txt`. `argent run screenshot --udid $VERIFY_TROVE_UDID --scale 1 --includeImageInContext false` saved under `$VERIFY_TROVE_ARTIFACTS/onboarding-home.png`. Second read: open Settings → **Accounts** and confirm **Verify Checking** appears (`aria-label` / account row).

## Gotchas

- If any account already exists, `/` never shows welcome — erase or reinstall first.
- Form CTA label changes: **Continue** on name/balance, **Plant it** / **Planting…** on style.
- Keyboard covering the garden is expected; CTA stays reachable but moves up — re-`describe` before tapping **Continue** while the keyboard is open.
- Completing onboarding without tapping **Open Trove** leaves the celebration screen — not yet Home.
- Erase All Data is destructive; only use it on the dedicated verify simulator.
- Opening balance may be skippable when a prior draft amount remains; assert the celebration + Accounts second-read, not each intermediate label.
