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

- The design source is the Claude Design canvas "Trove Design System" (https://claude.ai/artifact/9LXFeFuxSLfphLSzzs9iGH). Match it rather than the old app.
- All UI lives in `src/ui/trove`; import components from `src/ui/trove/index.ts`. The legacy `src/ui` kit and `phosphor-react-native` are gone; only `src/ui/motion.ts` remains outside `trove`.
- Tokens: `src/ui/trove/tokens/colors.json` is the single color source, read by `colors.ts` (iOS `DynamicColorIOS`, Android `PlatformColor`) and by `plugins/withAndroidThemeColor.js` (day/night resources). A new token needs `npx expo prebuild --platform android` before the next Android build.
- Components read semantic tokens only. Native props that reject dynamic colors may use the raw light/dark pairs from `troveRawColors` inside `src/ui/trove`.
- Typography: IBM Plex Mono for amounts and numbers, Nunito 400/700/800 for words.
- Icons: the Trove SVG set in `src/ui/trove/icon/icon-paths.ts`, rendered through the Trove `Icon` component. No emojis in UI.
- Use module-level native `StyleSheet`. This supersedes the root document's Tailwind requirement for this app.
- Use the Trove tab bar (`src/ui/trove/tab-bar`), not native tabs. Keep business actions injected through props.
- Preview components in the dev-only gallery at `trove-next://dev/trove?section=<key>`.
- Use `react-native-ease` for soft fades and transitions, respecting reduced motion. Reanimated is permitted only for a documented interaction Ease cannot implement.
- Use `@legendapp/list` for long lists. Use native controls where they improve platform behavior.
- Keep clear pressed, loading, disabled, empty, and error states, and accessible text scaling.
- One React component per file; meaningful hooks in separate files and pure business functions outside presentation components. Let React Compiler handle memoization.

## Verification

Load `verify-trove-next` for a screen, gesture, empty state, error state, auth, Home, Ledger, Market, or Household change in this app. Load it for a visible bug that needs a regression, and for recording or repairing an Argent flow. Flows live in `apps/mobile-next/.argent/flows`. The dev client closes the Expo dev menu when JavaScript loads.

Quote the replay command and the device for every pass. Name any device or backend check that did not run.
