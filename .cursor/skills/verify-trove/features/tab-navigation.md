# Tab navigation

Tab navigation lets a user move between Home, Ledger, Inbox, Envelopes, and Settings via the glass tab bar without losing the local session.

## Sub-features

- `tab-ledger` opens the Ledger tab.
- `tab-inbox` opens the Inbox tab.
- `tab-envelopes` opens the Envelopes tab.
- `tab-settings` opens the Settings tab.
- `tab-home` returns to Home (house icon; empty accessibility title).
- `tab-create` is adjacent chrome (**Create transaction**) and must not be confused with a tab.

## How to get to it (user POV)

- After onboarding, the glass tab bar is visible on main routes.
- Tap tab icons / labels along the bottom pill.
- Deep links: `trove:///`, `trove://ledger`, `trove://inbox`, `trove://envelopes`, `trove://settings`.

## Driving it with Argent

Preconditions:

- Doctor passes.
- App is past onboarding (account exists) so the tab bar is mounted.
- Capture baseline `$VERIFY_TROVE_ARTIFACTS/tabs-home.describe.txt` on Home first.

- **Ledger.** Tap accessibility label **Ledger**. Await Ledger screen identity (ledger content or empty state). Save `tabs-ledger.describe.txt` + `tabs-ledger.png`.
- **Inbox.** Tap **Inbox**. Await inbox content. Save `tabs-inbox.*`.
- **Envelopes.** Tap **Envelopes**. Await title **Envelopes** / coming-soon message. Save `tabs-envelopes.*`.
- **Settings.** Tap **Settings**. Await **Profile & household** / **Erase All Data**. Save `tabs-settings.*`.
- **Home return.** Prefer `argent run open-url --udid $VERIFY_TROVE_UDID --url "trove:///"` or tap the house icon via component tree. Await **Create transaction** still present and Settings-specific copy gone. Save `tabs-home-return.*`.

## Gotchas

- Home tab `options.title` is `""` — there is no **Home** accessibility label.
- **Money Movement** may be hidden unless PostHog flag `enable-money-movement` is on — absence is not a failure.
- Floating **Create transaction** is not a tab; tapping it leaves the tab navigator for the transaction stack.
- Swipe-on-capsule gesture exists; prefer explicit tab taps for deterministic proof.
