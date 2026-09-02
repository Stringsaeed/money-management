# Trove verification map

This directory is the maintained source for verifying user-facing behavior of Trove. Read this index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Drive iOS simulator UDID from `VERIFY_TROVE_UDID` (default iPhone 17 `D1509E32-FDCD-4788-93A3-DB775B256CFA`).
- Bundle id `com.stringsaeed.moneymanagement` installed; Metro healthy on `:8081`.
- Run `.cursor/skills/verify-trove/scripts/doctor.sh` and require pass before any mutation.
- Evidence goes under `.cursor/skills/verify-trove/artifacts/<run-id>/`.
- Never drive an instance / UDID that was not claimed by this verification run.
- Local-first ledger: signing in is optional for core money features. Prefer anonymous local data unless the feature file requires auth. Anonymous session probe errors must not block the local ledger (see `LedgerDataSourceGate`).

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise.
- Prefer `testID` / accessibility labels from the skill table over screenshot coordinates.
- Treat every Argent command as literal. Keep quoted names and flags unchanged.
- Run device actions through Argent MCP or `pnpm exec argent run <tool>`.
- After mutations that change fixtures, restore via the recipe's cleanup — never delete proof artifacts.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes a `describe` dump and a screenshot with Trove chrome visible.
- Mutation proof includes a second user-facing read of the stored value.
- Record the feature ID and entry point used with every artifact.
- Report an unreachable path with the attempted command and unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it with Argent`
4. `Gotchas`

## Features

- [First-account onboarding](./onboarding.md) — welcome → name → balance → style → Open Trove.
- [Create a transaction](./create-transaction.md) — floating + → amount → save → journal.
- [Tab navigation](./tab-navigation.md) — Ledger, Inbox, Envelopes, Settings tabs.
- [Settings and accounts](./settings-accounts.md) — Settings → Accounts list / Erase All Data.
- [Envelopes placeholder](./envelopes.md) — Envelopes tab empty state until budgeting ships.
