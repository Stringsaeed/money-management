# Envelopes placeholder

Envelopes is the budgeting tab. Today it shows a coming-soon empty state so users can discover the destination before envelope budgeting ships.

## Sub-features

- `envelopes-open` opens the Envelopes tab from the tab bar.
- `envelopes-empty` shows title **Envelopes** and the coming-soon message.
- `envelopes-setup` (future) will cover setup / workspace flows under `/envelopes/setup` and `/envelopes/workspace` — not required until those screens are user-reachable from the tab.

## How to get to it (user POV)

- Tap **Envelopes** in the glass tab bar.
- Deep link `trove://envelopes`.

## Driving it with Argent

Preconditions:

- Doctor passes.
- Tab bar visible (past onboarding).

- **Open Envelopes.** Tap accessibility label **Envelopes**. Await visible title **Envelopes** and message containing `Budget envelopes are coming soon`.
- **Proof.** Save `$VERIFY_TROVE_ARTIFACTS/envelopes.describe.txt` and `envelopes.png` showing the empty state illustration and copy.
- **Leave.** Tap **Settings** or `open-url trove:///` so the next feature starts from a known tab.

## Gotchas

- Setup/workspace routes exist in the router tree but the index currently does not link into them — do not fail this feature for missing setup entry points.
- When real envelopes ship, replace this file via `/maintain-verification-skill` rather than proving only the placeholder.
