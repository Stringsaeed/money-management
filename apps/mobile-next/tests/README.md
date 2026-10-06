# Trove Next end-to-end tests

UI tests for the iOS dev build, written with [e2e](https://e2e.tester.army) and driven
on a simulator through `@e2e-dev/mobile`. The config is `e2e.config.ts`; the agent skill
lives in `.agents/skills/e2e` (`pnpm exec e2e guide` prints it).

## One-time setup

1. Install the dev build on a simulator: `pnpm ios:next` from the repo root.
2. Sign in the model used by `agent.*` steps: `pnpm exec e2e login openai`.
3. Optional: pin the simulator with `E2E_IOS_DEVICE="Trove Next QA iPhone 17"` (a name
   or UDID). Unset, the engine uses a booted iOS simulator, or boots one.

## Running

```bash
pnpm test:e2e                          # everything
pnpm test:e2e:exact                    # skip model-driven tests (no login needed)
pnpm exec e2e run tests/accounts.e2e.ts
pnpm exec e2e run --grep "searching"   # by title
pnpm exec e2e run --tag transactions   # by tag
```

From the repo root, `pnpm e2e:next` builds the workspace packages first.

The runner starts the stack with `scripts/e2e-stack.mjs`:

- the local API (`pnpm --filter @trove/api dev:next`, PGlite, `127.0.0.1:3012`)
- Metro on `8081`, with `EXPO_PUBLIC_API_URL` forced to the local API (this overrides `.env`)
- a warm iOS bundle, checked to contain the local API URL, so a run never writes to a
  remote ledger
- a readiness answer on `127.0.0.1:8099`

An API or Metro you already have running is reused. Reusing a Metro that was started with a
different `EXPO_PUBLIC_API_URL` (e.g. production from `.env`) fails the run with a message
saying how to restart it. Logs go to `.e2e/logs/app.log`; results to `.e2e/report.json`.

## How the tests are isolated

`tests/support/fixtures.ts` clears the simulator keychain (where the session lives) and
launches the app fresh before every test:

- `test`: continues as a brand-new guest, so the test starts on an empty Home with its own
  empty ledger on the local API.
- `signedOutTest`: stops on the sign-in screen.

No test depends on another, and none needs cleanup.

## Writing tests

- Exact values (amounts, names, notes) go through `screen`. Amounts use `enterAmount()` on the
  on-screen number pad; it is covered by the keyboard while a text field is focused, so type
  the amount before the name or note.
- `agent.act` drives one goal at a time (tagged `agent`); pin every goal with an `expect` right
  after it, which also lets the replay cache rerun it without a model call.
- Locators come from accessible names in `src/` (`accessibilityLabel`, `Button` titles).
  RN `accessibilityRole="alert"` text reads as plain text on iOS, so match it with `getByText`.
- Ledger search is sent on the keyboard's search key: `fill()` then `press("Enter")`.
- Shared flows (`addFirstAccount`, `addExpense`, `addCategory`) live in `tests/support/ledger.ts`.
