# Trove Next

The replacement Expo app lives alongside `apps/mobile`. Both use Expo SDK 57,
React Native 0.86, Nunito, and Garden Ledger colors. Trove Next has its own app
identifier, callback scheme, credentials, and financial data.

## Run locally

From the repository root:

```sh
pnpm install
cp apps/mobile-next/.env.example apps/mobile-next/.env
pnpm dev:server:next
```

The development API starts a persistent, isolated PGlite Postgres database and
serves the real V2 handlers at `http://127.0.0.1:3012/api/v2`. It does not load or
migrate legacy financial tables. Data lives in ignored `packages/api/.next-data`.

In another terminal:

```sh
cd apps/mobile-next
stim start
stim ios
# Or, with the Android SDK command-line tools on PATH:
stim android
```

For Android, also reverse the API port on the emulator reported by Stim:

```sh
adb -s <emulator-serial> reverse tcp:3012 tcp:3012
```

The root `start:next`, `ios:next`, and `android:next` scripts are available for
ordinary Expo development. `mobile-next` participates in Turbo's build, type,
and test tasks. It requires a development build because Ease and OP SQLite
contain native code.

## Configuration

- `EXPO_PUBLIC_API_URL` includes `/api/v2`.
- Set `EXPO_PUBLIC_WORKOS_CLIENT_ID` for registered sign-in and allow
  `trove-next://callback` in that WorkOS application's redirect list. Keep the
  old app's callback. Guest access does not require signing in to WorkOS.
- The local server reads existing `apps/server/.env` and `packages/infra/.env`.
  Optional `packages/api/.env.next` overrides them for this development server.
- Market provider secrets belong on the server: `MARKET_STOCKS_API_KEY`
  (Twelve Data), `MARKET_METALS_API_KEY` (Metals.Dev), and
  `MARKET_CRYPTO_API_KEY` (FreeCryptoAPI). Missing/failed feeds are shown
  explicitly; the app never substitutes sample prices.

## Boundaries

- `src/ui`: reusable presentation components, native tokens, icons, and Ease
  motion. Lint prevents imports from feature/data layers.
- `src/features`: Home, Ledger (transactions and recurrence, accounts,
  categories), Market, authentication, and Household workflows.
- `src/data`: validated HTTP access and identity/scope-isolated TanStack DB
  query collections. Requests fail visibly when offline.
- `src/navigation`: custom tab navigation and the Personal/Household selection.
- `packages/api/src/v2`: direct, versioned APIs using fresh `v2_*` tables.

WorkOS owns registered identity and invitations. A guest gets an opaque,
revocable session. Saving a guest ledger to an account is transactional; a
conflicting nonempty account ledger leaves guest data intact. A person can
belong to one active V2 household while retaining a personal ledger.

Budgets and onboarding are disabled. The old sync pipeline is not imported.
OP SQLite is included for the later persistence phase; offline mutation
queues, pull/push, and conflict resolution are deliberately not implemented.

## Verify

```sh
pnpm check:next
pnpm --filter @trove/api test
# With the local API running:
pnpm --filter @trove/api test:next:http
pnpm lint:fix
pnpm format
```

The HTTP smoke test creates disposable guest data only against localhost. It
checks auth boundaries, idempotency, stale edits, recurring settlement, Home
totals, and guest isolation.

## Release

`0016_mobile_next` is an additive, journaled database migration. Apply it using
the repository's reviewed production migration workflow before deploying V2;
see `docs/agents/postgres-migrations.md`. The existing `/rpc` APIs remain intact.
The Worker mounts `/api/v2` and includes V2 recurring settlement in its scheduled
handler. This app intentionally has no shared EAS update URL: configure its
own EAS project before publishing builds or OTA updates.
