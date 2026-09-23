# Trove Next

## Product boundary

- This is the replacement app, installed alongside `apps/mobile`. Preserve the old app and its backend behavior.
- Use the existing Expo SDK, React, and React Native versions. Keep a separate bundle id, URL scheme, SecureStore keys, database filename, and update identity.
- All financial data starts fresh in V2 storage. Use `/api/v2` APIs, never legacy commands, sync providers, PowerSync, budget projections, or old app business modules.
- Deliver Home; Ledger with transactions, recurring transactions, accounts, and categories; Market; and optional Household. Market retains the existing read-only quotes feature.
- Budgets and onboarding remain disabled. Budget implementation is absent, with an explicit disabled feature flag reserved for a future replacement.
- A person may have a personal ledger without a household. Enforce at most one active household membership on the backend; leaving permits joining another. Keep WorkOS invitations.
- Offer sign-in first and Continue as guest. WorkOS owns registered authentication. A small backend-issued guest session owns its own data and can be explicitly claimed after verified sign-in.

## Architecture

- Keep `src/app` as thin Expo Router route files.
- `src/ui` owns reusable presentation components and tokens. It must not import feature code, API clients, auth, databases, financial models, or business hooks.
- `src/features` owns Home, Ledger, Market, Household, and authentication workflows. Recurring transactions belong inside Ledger's transaction feature.
- `src/data` owns validated API requests, scoped TanStack DB collections, and cache lifecycle. Scope caches by identity and personal/household ledger; clear them when access changes.
- Begin internet-first with TanStack DB. OP SQLite is the future local persistence layer; defer pull/push and offline mutation queues until separately designed. Show honest offline/error states.
- Use small, concrete interfaces. Extract shared code only when it has a real consumer; avoid speculative frameworks.

## Visual system

- Rebuild components thoughtfully rather than copying old component implementations. Match the current Garden Ledger palette and Nunito typography from `apps/mobile/lib/design-tokens.ts`.
- Use module-level native `StyleSheet` and dynamic native color tokens. This supersedes the root document's Tailwind requirement and stale typography description for this app.
- Resolve iOS colors with `DynamicColorIOS` and Android colors through native day/night resources and `PlatformColor`.
- Native control props that reject opaque color objects may bridge the canonical light/dark raw palette inside `src/ui`; keep ordinary React Native styles on dynamic tokens.
- Use subtle shadows, thin rings, generous spacing, accessible text scaling, and clear pressed, loading, disabled, empty, and error states.
- Use Phosphor icons with `Icon`-suffixed imports. Keep the icon boundary small so individual icons can be replaced. No emojis in UI.
- Build a custom tab bar similar to the current app, not native tabs. Keep business actions injected through props.
- Use `react-native-ease` for soft fades and transitions, respecting reduced motion. Reanimated is permitted only for a documented interaction Ease cannot implement.
- Use `@legendapp/list` for long lists. Use native controls where they improve platform behavior.
- One React component per file; meaningful hooks in separate files and pure business functions outside presentation components. Let React Compiler handle memoization.

## Verification

- Follow root pnpm tooling and Conventional Commits. Keep tests under `__tests__` to match the active lint rule.
- Verify types, relevant API/component tests, `pnpm lint:fix`, and `pnpm format`. Do not reformat unrelated files.
- Verify real iOS and Android development builds with Stim and Argent. Check auth/guest persistence, ledger CRUD, recurring rules, Market, household access, light/dark appearance, and reduced motion.
- Report external configuration or runtime checks that remain unverified; never present fixtures or mock responses as live backend verification.
