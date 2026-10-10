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

## Building UI

Trove is the only UI kit. The design source is the Claude Design canvas "Trove Design System" (https://claude.ai/artifact/9LXFeFuxSLfphLSzzs9iGH); the code is `src/ui/trove`, exported from `src/ui/trove/index.ts`. Feature code composes Trove components and owns layout and wiring only.

1. **Look up the component.** Find it in `src/ui/trove/index.ts` and its board on the canvas. Done when every control on the screen maps to a Trove export.
2. **Report a gap.** When a screen or the canvas needs a piece Trove lacks, report it (where, what it does, closest Trove option) and keep going with what exists. Build a new Trove component only when the user asks: inside `src/ui/trove`, matched to its canvas board, with tests.
3. **Compose the screen.** `Screen` is the root (left/right safe-area insets always on; pass `edges` for top/bottom). Tab roots use `Header` (large); pushed screens use `Header variant="compact" onBack` with the native header hidden in `src/navigation/data-navigator.tsx`; modal editors use `EditorHeader`.
4. **Style with tokens.** Text through `Text variant tone`, colors from `colors.*`, spacing from `space`/`layout`, radii from `radius`, in a module-level `StyleSheet`. Hex values live only in `src/ui/trove/tokens/colors.json`.
5. **Verify.** Check the screen that uses the component on iOS and Android, following Verification below.

Rules:

- **Money**: every amount is `<Amount>`. `minor` takes signed integer minor units (spending negative; income `signDisplay="always"`; transfers `signDisplay="never"`); `value` plus `significant` takes decimal-string prices below a cent.
- **Tiles**: lists show the category emoji on a neutral `CategoryTile`; transfers and uncategorised entries use `kind`; the user's category `color` appears only on category screens and editors.
- **Icons and emoji**: icons come from the Trove `Icon` set (`src/ui/trove/icon/icon-paths.ts`). Emoji appear only as user data (category and account emoji) or through a Trove prop that takes one (`Breadcrumb`, `OptionTile`, `NoteField`, toast `emoji`).
- **New color token**: add it to `tokens/colors.json` and its group in `tokens/colors.ts`, then run `npx expo prebuild --platform android` and `stim android --no-build-cache`. A missing `@color/trove_*` resource crashes Android with "Error while updating property".
- **Native color props** that reject dynamic colors read `troveRawColors[mode]`, inside `src/ui/trove` only.
- **Hermes** lacks `Intl.NumberFormat#formatToParts`; format with `format()` as `src/ui/trove/amount/amount-parts.ts` does. Jest runs on Node and passes anyway, so check number formatting on a device.
- **Motion**: `react-native-ease` through `troveTransition`, which honors reduced motion. Reanimated only for a documented interaction Ease cannot implement.
- **Lists**: `@legendapp/list` for long lists.
- **Files**: one React component per file; meaningful hooks in their own files; pure business functions outside components. React Compiler handles memoization.

## Verification

Load `verify-trove-next` for a screen, gesture, empty state, error state, auth, Home, Ledger, Market, or Household change in this app. Load it for a visible bug that needs a regression, and for recording or repairing an Argent flow. Flows live in `apps/mobile-next/.argent/flows`. The dev client closes the Expo dev menu when JavaScript loads.

Quote the replay command and the device for every pass. Name any device or backend check that did not run.
