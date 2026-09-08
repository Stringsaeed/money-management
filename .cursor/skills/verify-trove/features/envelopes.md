# Envelopes workspace

Envelopes is the budgeting tab. After onboarding with no activated workspace it shows an empty currency-workspace state and a **Set up Envelopes** path into `/envelopes/setup`. When a workspace exists, the same tab shows the live monthly overview.

## Sub-features

- `envelopes-open` opens the Envelopes tab from the tab bar.
- `envelopes-empty` shows **No currency workspace yet** and **Set up Envelopes**.
- `envelopes-setup` opens `/envelopes/setup` (**Give your Money a job** / header **Setup Envelopes**). Draft-only today — no confirm/activate CTA on this screen.
- `envelopes-overview` (when a workspace exists) shows month heading, Unassigned Money, envelope list, New Envelope / Move Money.

## How to get to it (user POV)

- Tap **Envelopes** in the glass tab bar.
- Deep link `trove://envelopes` or `trove://envelopes/setup`.
- Empty index links into setup; `/envelopes/workspace` remounts the same workspace screen and is not a separate tab destination.

## Driving it with stim + agent-device

Preconditions:

- Doctor passes.
- Tab bar visible (past onboarding).
- Prefer no activated `budget_workspaces` row (default after fresh onboarding).

Preferred: `flows/05-envelopes.yaml`.

Interactive recipe:

- **Open Envelopes.** Press `label="Envelopes"`. Await **No currency workspace yet** and **Set up Envelopes** (do **not** await “coming soon”).
- **Proof.** Save `$VERIFY_TROVE_ARTIFACTS/envelopes.snapshot.txt` and `envelopes.png`.
- **Setup intro.** Press **Set up Envelopes**. Await **Give your Money a job** (may include trailing 🌱). Save `envelopes-setup.*`.
- **Leave.** Open `trove:///` or press **Settings** so the next feature starts from a known tab.

## Gotchas

- Coming-soon copy is gone — recipes that wait for `Budget envelopes are coming soon` will fail.
- Setup is draft-only; do not fail this feature for missing confirm/activate.
- If a workspace is already activated, expect overview chrome instead of the empty state — treat that as a different fixture.
- `/envelopes/workspace` is not linked as a distinct product entry from the empty tab.
