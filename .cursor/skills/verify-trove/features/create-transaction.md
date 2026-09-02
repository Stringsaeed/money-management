# Create a transaction

Create transaction lets a user open the composer from the floating +, enter an amount on the numpad, optionally add a note, save, and see the entry reflected on Home / Ledger.

## Sub-features

- `tx-open` opens `/transaction/new` from **Create transaction**.
- `tx-amount` enters an amount via the on-screen numpad.
- `tx-note` sets optional note text (`Add a note...`).
- `tx-save` commits via the header **save** (checkmark) control.
- `tx-persist` shows the new entry after returning to Home / Ledger.

## How to get to it (user POV)

- Tap the floating **Create transaction** (+) button on any main tab.
- From an account detail screen, use its create affordance (same `/transaction/new` route).
- Deep link `trove://transaction/new` when installed.

## Driving it with Argent

Preconditions:

- Doctor passes.
- At least one account exists (complete [onboarding](./onboarding.md) first if needed).
- Note a unique description such as `Verify coffee 4821` so persistence is unambiguous.

- **Open composer.** Tap accessibility label **Create transaction**. Await transaction composer (amount display / numpad digits). Save `$VERIFY_TROVE_ARTIFACTS/tx-open.describe.txt`.
- **Enter amount.** Tap numpad digits for a non-zero amount (e.g. `1`, `2`, `5` → 125.00 display depends on pad state — prefer entering `1` `2` `.` `5` `0` or clear then type). Confirm the large amount text is not `0.00`.
- **Optional note.** Tap the note field (`Add a note...`), `keyboard` type `Verify coffee 4821`.
- **Save.** Tap the native header control labeled **save** (checkmark). Await dismissal back to the previous tab.
- **Confirm persistence.** On Home or Ledger, `describe` / screenshot must show `Verify coffee 4821` (or the amount line if note empty). Save `$VERIFY_TROVE_ARTIFACTS/tx-home.describe.txt` and `tx-home.png`.
- **Second read.** Open the transaction row, confirm amount and note match. Save `$VERIFY_TROVE_ARTIFACTS/tx-detail.describe.txt`.

## Gotchas

- Amount `0` cannot save — form throws and haptic fires; enter an amount above 0.
- Numpad digit buttons have no accessibility labels — use visible text `1`…`9`/`0` from `describe`, or `debugger-component-tree`.
- Header **save** is an SF Symbol checkmark with label `save` (lowercase) — not a big **Save** button in the form body.
- Category / account pickers are bottom sheets; dismiss them if opened accidentally before asserting save.
- Home recent journal is limited; if the list is long, scroll or open Ledger.
