# Create a transaction

Create transaction lets a user open the composer from the floating +, enter an amount on the numpad, optionally add a note, save, and see the entry reflected on Home / Ledger.

## Sub-features

- `tx-open` opens `/transaction/new` from **Create transaction**.
- `tx-amount` enters an amount via the on-screen numpad.
- `tx-note` sets optional note text (`transaction-note-field` / **Transaction note** / placeholder `Add a note...`).
- `tx-save` commits via the header **save** (checkmark) control.
- `tx-persist` shows the new entry after returning to Home / Ledger.

## How to get to it (user POV)

- Tap the floating **Create transaction** (+) button on any main tab.
- From an account detail screen, use its create affordance (same `/transaction/new` route; unlabeled `+`).
- Deep link `trove://transaction/new` when installed.

## Driving it with stim + agent-device

Preconditions:

- Doctor passes.
- At least one account exists (complete [onboarding](./onboarding.md) / `flows/01-onboarding.yaml` first if needed).
- Note a unique description such as `Verify coffee 4821` so persistence is unambiguous.

Preferred: `flows/03-create-transaction.yaml` (after onboarding).

Interactive recipe:

- **Open composer.** Press `label="Create transaction"`. Await `id="transaction-note-field"` / numpad digits. Save `$VERIFY_TROVE_ARTIFACTS/tx-open.snapshot.txt`.
- **Enter amount.** Press visible digits `1` `2` `5` (integer path → 125.00). Prefer digits over the pad decimal — the `.` key is an icon, easy to miss.
- **Optional note.** Fill `id="transaction-note-field"` with `Verify coffee 4821`.
- **Save.** Press header `label="save"` (checkmark). Do **not** press **Make recurring**. Await dismissal.
- **Confirm persistence.** Home or Ledger must show `Verify coffee 4821`. Screenshot `$VERIFY_TROVE_ARTIFACTS/tx-home.png`.
- **Second read.** Press the row; composer shows the same note and amount.

## Gotchas

- Amount `0` cannot save — form throws and haptic fires; enter an amount above 0.
- Numpad decimal is icon-only; amount display also paints `.` — tap pad digits first.
- Header **save** is lowercase label `save`, not a big **Save** in the form body.
- Header **Make recurring** creates a rule, not a journal row — avoid during this proof.
- Empty note: row title falls back to category name, not the amount line.
- Home recent journal is limited to 10; if missing, open Ledger.
