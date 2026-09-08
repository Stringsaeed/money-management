# Tab navigation

Tab navigation lets a user move between Home, Ledger, Inbox, Envelopes, and Settings via the glass tab bar without losing the local session.

## Sub-features

- `tab-ledger` opens the Ledger tab.
- `tab-inbox` opens the Inbox tab.
- `tab-envelopes` opens the Envelopes tab (live workspace empty or overview — not a coming-soon stub).
- `tab-settings` opens the Settings tab.
- `tab-home` returns to Home (house icon; empty accessibility title).
- `tab-create` is adjacent chrome (**Create transaction**) and must not be confused with a tab.

## How to get to it (user POV)

- After onboarding, the glass tab bar is visible on main routes.
- Tap tab icons / labels along the bottom pill.
- Deep links: `trove:///`, `trove://ledger`, `trove://inbox`, `trove://envelopes`, `trove://settings`.

## Driving it with stim + agent-device

Preconditions:

- Doctor passes.
- App is past onboarding (account exists) so the tab bar is mounted.
- Capture baseline `$VERIFY_TROVE_ARTIFACTS/tabs-home.snapshot.txt` on Home first.

Preferred: `flows/02-tab-navigation.yaml`.

Interactive recipe:

- **Ledger.** Press `label="Ledger"`. Await Ledger identity. Save `tabs-ledger.*`.
- **Inbox.** Press `label="Inbox"`. Await **Rejected Changes** / **Nothing rejected** (or header **Inbox**). Save `tabs-inbox.*`.
- **Envelopes.** Press `label="Envelopes"`. Await **No currency workspace yet** / **Set up Envelopes** (or live budget chrome). Do **not** await coming-soon copy. Save `tabs-envelopes.*`.
- **Settings.** Press `label="Settings"`. Await **Profile & household** / **Erase local data from this device**. Save `tabs-settings.*`.
- **Home return.** Prefer `openLink` / open `trove:///` or tap the house icon via snapshot refs. Await **Create transaction** still present. Save `tabs-home-return.*`.

## Gotchas

- Prefer `role=button label="…"` for glass tabs — bare `label="Ledger"` can AMBIGUOUS_MATCH against a parent `other`.
- Home tab `options.title` is `""` — there is no **Home** accessibility label.
- **Money Movement** may be hidden unless PostHog flag `enable-money-movement` is on — absence is not a failure (presence is also fine).
- Floating **Create transaction** is not a tab; tapping it leaves the tab navigator for the transaction stack.
- After `openLink` / deep links, accept the system **Open in “Trove (Dev)”?** alert (`agent-device alert accept`) and allow several seconds for AX to catch up — screenshots can be ready before `wait text` succeeds.
- Swipe-on-capsule gesture exists; prefer explicit tab taps for deterministic proof.
