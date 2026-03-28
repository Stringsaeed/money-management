# AGENTS.md

## Mission

- This document teaches autonomous agents how to work safely and efficiently inside this Expo monorepo.
- Follow everything here before touching AGENTS.md, because this file already merges those instructions plus extra context.
- Treat guidance as source of truth even if your runtime defaults differ; override only when the user explicitly says so.
- Default tone: concise, factual, high-signal commit-ready work with clear diffs and explanations.
- Prefer action now, questions later—clarify only when output would materially diverge.
- UI copy, labels, and decorative elements should use emojis freely to support the modern minimal design language; non-UI files (configs, scripts) remain ASCII-only.
- Never delete or revert user-owned changes unless they ask; keep the worktree state intact outside your edits.

## Commands & Tooling

- **Package manager: Yarn** (`yarn install`, `yarn run ...`); avoid npm/bun.
- Use `date-fns` for date parsing, formatting, arithmetic, and interval logic; do not hand-roll date math or ad-hoc `Date` utilities.
- Core scripts: `yarn start`, `yarn ios`, `yarn android`, `yarn web` for Expo entry points.
- Lint with `yarn lint` (oxlint) but always finish work by running `yarn lint:fix` followed by `yarn format` (oxfmt).
- Formatting check only: `yarn format:check` if you need CI parity without rewriting files.
- There is no dedicated build step; Expo bundler handles builds per platform when invoking the platform-specific start scripts.
- Jest + React Native Testing Library are configured. Keep the suite green and use `yarn test:ci` as the pre-merge gate.
- Single-test workflow: prefer `yarn test path/to/file.test.tsx` or `yarn jest path/to/file.test.tsx --runInBand` when isolating a failing case.
- Use `yarn dlx expo-doctor` or `npx expo install` only if health checks demand it—otherwise keep dependencies stable.
- Shell access: prefer specialized helpers (Read/Glob/Grep) for file IO; reserve Bash for git, yarn, or runtime commands.
- Never invoke destructive git commands (`reset --hard`, `checkout --`) without the user's explicit order.

## Workflow Expectations

- Start by skimming AGENTS.md and this file to refresh requirements for linting, formatting, skills, and Expo architecture.
- Before writing code, gather context with `glob`, `read`, or `grep`; inspect related files rather than editing blind.
- Apply single-file modifications with `apply_patch` when practical; avoid it for generated code or mass rewrites.
- After editing, run `npx tsc --noEmit` to catch type errors, then `yarn lint:fix && yarn format`—this is mandatory.
- Document any skipped steps (e.g., simulator run) in the final response so the user knows what still needs verification.
- Avoid questions like "Should I proceed?"; instead pick the safest default, act, and mention the assumption afterward.
- Keep commands succinct and never stream large logs; summarize key lines for the user.
- When referencing files to the user, wrap the repository-relative path in backticks so the CLI can hyperlink it.
- Tests are configured; still mention manual QA, simulator smoke checks, or component stories when relevant after UI changes.
- Emojis are encouraged in UI copy, labels, and decorative elements to reinforce the modern minimal design language; keep non-UI files (configs, scripts) ASCII-only.
- Respect user-owned dirty changes; do not format unrelated files even if the formatter would touch them.

## Repository Map

- `app/` holds Expo Router screens; `_layout.tsx` defines the root stack, `(tabs)/_layout.tsx` configures bottom tabs, `modal.tsx` exposes modal routes.
- Tab routes: `(tabs)/index.tsx` is the Home tab; mimic their patterns for new tabs.
- `components/` hosts shared UI; `components/ui/` for base primitives (`text.tsx`, `badge.tsx`, `button.tsx`, `icon.tsx`).
- `components/transaction/` groups transaction-related components, each in its own file or subdirectory with `types.ts`.
- `lib/utils.ts` exports `cn()` (clsx + tailwind-merge) for conditional class composition.
- `hooks/` contains data-fetching hooks (`use-accounts.ts`, `use-categories.ts`, `use-transactions.ts`) and UI hooks.
- `stores/` contains Zustand stores (e.g. `ui-store.ts`).
- `utils/` contains shared pure helpers (`currency.ts`, `date.ts`).
- `assets/` contains images/fonts; import static assets through Expo's module system rather than `require` strings.
- `global.css` configures NativeWind v5 + Tailwind CSS v4 theme (fonts, colors, custom tokens).
- `metro.config.js` uses `withNativewind(config)` with default options.
- `nativewind-env.d.ts` is a generated file committed to source control.
- `constants/`, `hooks/`, and `components/` share the `@/*` alias (configured in `tsconfig.json`) so prefer `import Foo from "@/components/Foo"` over relative `../../` walks.
- `.oxlintrc.json` and `.oxfmtrc.json` codify lint/format behavior; read them before changing stylistic conventions.

## Design System: Paper Ledger

The app follows the **Paper Ledger** design system — a clean, editorial aesthetic inspired by financial ledgers and newspapers.

### Typography

- **Heading font**: Newsreader (serif) — used for titles, amounts, section headers. Classes: `font-heading-thin`, `font-heading-normal`, `font-heading-medium`. Headings are typically italic.
- **Body font**: Plus Jakarta Sans (sans-serif) — used for labels, descriptions, UI text. Classes: `font-body-normal`, `font-body-medium`, `font-body-semibold`.
- All font families are defined as CSS custom properties in `global.css` under `@theme`.

### Colors

- `ink` (#1C1B1A) — primary text, active elements
- `surface` (#F9F8F6) — page background
- `surface-container` (#F1F0EE) — card/input backgrounds
- `surface-dim` (#EBE8E3) — pressed/hover states
- `ledger-outline` (#EBE8E3) — borders, dividers
- `sage` (#8B9D83) — income, positive amounts
- `terracotta` (#B48A7B) — expenses, destructive actions
- `destructive` (#D9534F) — delete actions, errors

### Shared Constants

- `components/transaction/constants.ts` exports reusable values: `INK`, `INK_MUTED`, `SURFACE_CONTAINER`, `DESTRUCTIVE`, `SHEET_BG`, `SHEET_HANDLE`, `layoutTransition`.
- Bottom sheets use `SHEET_BG` and `SHEET_HANDLE` for consistent appearance.

## Code Style & Imports

- TypeScript runs in strict mode; do not disable strictness to patch errors—fix the types instead.
- Enforce named imports ordering manually; oxlint will catch duplicate or namespace misuse through `import/*` rules.
- Prefer `const` plus arrow functions for React components; annotate props with explicit interfaces or type aliases.
- When referencing assets (images, fonts), import them statically to keep Metro aware of dependencies; avoid dynamic `require` paths.
- JSX: keep components pure, avoid inline `function` definitions in render unless memoization is necessary, and ensure keys on iterated elements.
- Hooks: obey `react-hooks/rules-of-hooks` and include dependencies arrays that satisfy `react-hooks/exhaustive-deps`.
- Avoid `any`; prefer discriminated unions or `unknown` with proper type guards.
- Prefer `date-fns` over native `Date` mutation helpers for all business logic; only use native `Date` directly when a platform API requires a `Date` instance or exact `toISOString()` serialization is needed.
- Use the `@/*` alias consistently; root-relative imports improve readability and survive folder moves.
- Keep files small and purposeful—extract subcomponents when files exceed ~200 lines or serve multiple concerns. Strongly prefer many small, single-responsibility components over large monolithic ones; follow React and React Native best practices loaded from the relevant skills.
- **One component per file**: every React component must live in its own file. A component directory (e.g. `components/transaction/`) groups related components, hooks, types, and utilities together.
- **Hooks in separate files**: when a component's logic grows beyond simple inline state, extract a custom hook into its own file (e.g. `use-transaction-form.ts`) within the same directory.
- **Pure functions in utils**: pure helper functions belong in a `utils.ts` (or context-specific file like `currency.ts`, `date.ts`) within the relevant directory or `@/utils/` for shared helpers. Never inline business logic in component files.
- Default naming: `PascalCase` for components/types, `camelCase` for functions/constants, `SCREAMING_SNAKE_CASE` for env fallback constants.
- Error messages should explain the impact and next action, not just restate that something failed.
- When defining React Navigation routes, leverage Expo Router file conventions instead of manual stack registration.
- **Use `cn()` from `@/lib/utils`** for conditional class composition instead of template literals or inline styles. Example: `cn("base-classes", condition && "conditional-class")`.
- Keep optional chaining and nullish coalescing in place of defensive `&&` ladders when reading nested data.
- Avoid `useMemo`/`useCallback` we use react-compiler to do it for us.
- Export a default component per screen file; named helpers can live in the same module but keep them near usage.
- For icons, use **phosphor-react-native**. Always import with the `Icon` suffix (e.g. `CaretRightIcon`, `GearIcon`) — the un-suffixed exports are deprecated and emit warnings. Use `weight={focused ? "fill" : "regular"}` to reflect active/inactive state.
- Keep `eqeqeq` behavior in mind: `==` is only acceptable where `smart` semantics cover `null == undefined`; otherwise use `===`.
- Do not mutate React state directly; clone arrays/objects or use functional updates.
- Avoid `require` for JSON/TS modules in TypeScript; use `import` statements so type checking works.

## Components & Theming

- Colors are defined in `global.css` `@theme` block; extend palettes there rather than scattering hex literals across files.
- Layout spacing should follow an 8px baseline when possible; keep cross-platform parity by aligning with Tailwind spacing tokens.
- Haptics: use Expo Haptics via centralized helpers (e.g. `triggerErrorHaptic` in component utils).
- **No inline styles**: always use tailwind `className` props for styling; never use the `style` prop for layout or visual properties that tailwind can express. Exceptions: `fontVariant: ["tabular-nums"]`, `borderCurve: "continuous"`, and dynamic colors from data (e.g. `${cat.color}20`) that cannot be expressed as Tailwind classes.
- **Use standard Tailwind classes**: prefer standard size classes over arbitrary values. Use `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px). Use `tracking-tight`, `tracking-wide`, `tracking-wider` instead of `tracking-[0.5px]`, `tracking-[1px]`, `tracking-[1.5px]`. Only use arbitrary values (`text-[13px]`, `text-[11px]`) when no standard class matches.
- **Safe area**: every screen must respect safe areas. Use `safe-top` / `safe-bottom` / `pt-safe` / `pb-safe` tailwind classes on the outermost container of every screen so content is never obscured by notches or home indicators.
- **Animations on layout change**: whenever a layout-level change happens (list items added/removed, conditional panels, screen transitions), wrap affected elements in Reanimated `Animated.View` and apply `entering`/`exiting`/`layout` props from `react-native-reanimated` so all layout shifts animate smoothly.
- **Modern minimal design with emojis**: default to clean, minimal UI with generous whitespace. Prefer emojis over icon libraries for decorative or label purposes wherever they convey the intent clearly.
- Animations should rely on Reanimated v4; never mix imperative Animated API unless Reanimated cannot cover the case.
- Favor React Compiler friendly patterns (no dynamic hook order, no conditional hook definition) because the project has `reactCompiler` experiments on.

## Picker / Bottom Sheet Pattern

When creating picker components (account, category, date, etc.), follow this established pattern:

- Each picker lives in its own directory: `components/transaction/<name>-picker/` with `<name>-picker.tsx` and `types.ts`.
- The picker manages its own `BottomSheetModal` ref internally — callers never touch refs.
- Accept `children` as trigger: use `React.Children.only` + `React.cloneElement` to inject `onPress` on the child element.
- Accept `onChange` callback for value changes.
- Use `@gorhom/bottom-sheet` with `enableDynamicSizing`, `SHEET_BG`, `SHEET_HANDLE` from constants.
- Dismiss the sheet after selection via `ref.current?.dismiss()`.

## Form State Management

- Use `@tanstack/react-form` with `useForm` for complex forms (e.g. transaction form).
- Use `form.Subscribe` with granular `selector` props to minimize re-renders — only subscribe to the specific field values each component needs.
- Keep form orchestration in a slim parent component; delegate rendering to child components via `form.Subscribe`.

## State, Data, and Errors

- Local UI state lives with `useState`; cross-screen data should move into context, query cache, or file-level modules rather than prop drilling.
- Fetching should use `fetch`/`expo` APIs with centralized helpers under `hooks/` or `lib/`; prefer SWR-like caching if data persists between screens.
- Whatever networking helper you add must guard against offline mode and provide user-visible error cases.
- Validate inputs aggressively; never assume API responses are shaped as expected without runtime checks or TypeScript validators.
- For asynchronous flows, always `.catch` network promises and display fallback UI instead of letting React swallow unhandled rejections.
- Log unexpected failures with enough metadata to debug locally, but avoid leaking secrets or user PII into logs.
- Keep optimistic updates reversible; store the rollback payload and ensure UI resolves correctly on error.
- Prefer TypeScript enums or union literals for status markers rather than loose strings.
- When bridging to native modules, guard usage behind platform checks and provide a non-op fallback on unsupported targets.
- Navigation errors (missing params, invalid route) should redirect back to a safe tab instead of crashing the app.
- If you must polyfill behavior for web, isolate it in `*.web.ts[x]` files instead of conditionals sprinkled across components.

## Testing & QA

- Automated tests are set up with Jest + React Native Testing Library. Use `yarn test:ci` for CI parity and pre-merge verification.
- Prefer automated coverage first, then manual QA with `yarn ios`, `yarn android`, or `yarn web` when UI behavior changes.
- When adding tests later, prefer colocated `*.test.tsx` or `*.spec.ts` files near the unit under test.
- Snapshot tests should target stable UI (icons, large layout) and live under a `__snapshots__` directory ignored by Metro.
- Keep Detox/E2E scripts separate from Expo start scripts to avoid simulator conflicts.
- Report any manual QA done (device, simulator, steps) so the user can reproduce issues or confirm fixes.
- When skipping runtime QA, explicitly mention why (no simulator, time constraints) and suggest what the user should run.

## Git & Collaboration

- Always create a commit after completing each task unless the user explicitly instructs otherwise.
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, etc.) and keep messages focused on the "why".
- Run `git status`, `git diff`, and `git log` via the Bash tool, reporting summaries instead of full raw output when users ask.
- Never amend or force-push unless instructed; if a pre-commit hook rewrites files, create a new commit containing the updated changes.
- Do not stage or commit secrets (e.g., `.env`, credentials); warn the user if they request it.
- Respect users' existing dirty files—avoid formatting or touching unrelated files to keep diffs minimal.
- Reference files with inline code formatting (`path/to/file.tsx`) in final responses so links stay clickable in the CLI.
- Describe verification steps (lint, format, simulator run) explicitly in the final message.
- If a command fails, capture the error text and explain what needs fixing instead of rerunning blindly.

## Automation Skills

- Before writing Expo or React Native code, load relevant skills listed in AGENTS.md (e.g., `building-ui`, `data-fetching`, `react-native-best-practices`).
- Use `vercel-react-best-practices` or `vercel-composition-patterns` when touching shared React components or hooks.
- Call `react-native-best-practices` or `vercel-react-native-skills` for performance tuning, gesture-heavy work, or list virtualization.
- When dealing with navigation or API routes, bring in `api-routes` or `building-ui` skills as additional references.
- For deployment, consult `deployment` or `cicd-workflows` skills before modifying CI/CD files.
- If you need DOM-specific components or crossover web targets, reference the `use-dom` skill instructions.
- Only skip skill invocation when editing plain text or metadata unrelated to Expo/React; otherwise mention why the skill was unnecessary.
- Document in commits/PR descriptions which skills informed the change if it improves traceability.
- Keep skill-loaded guidance in mind for future edits; you do not need to reload them during the same session unless the scope changes.

## Reference Checklist

- [ ] Read this file and AGENTS.md before coding.
- [ ] Load the skill bundle that matches the task scope.
- [ ] Gather context with `glob`/`read` rather than editing blindly.
- [ ] Implement the change using TypeScript strict-safe patterns and repo-specific theming.
- [ ] Use tailwind `className` only — no inline `style` props for visual/layout rules.
- [ ] Use `cn()` for conditional classes — no template literal class concatenation.
- [ ] Use standard Tailwind size classes — no arbitrary values when a standard class exists.
- [ ] Apply `safe-top` / `safe-bottom` classes on every screen's outermost container.
- [ ] Wrap layout-changing elements in Reanimated `Animated.View` with `entering`/`exiting`/`layout` props.
- [ ] Decompose into small, single-responsibility components; no large monoliths.
- [ ] Use emojis in UI copy and labels to reinforce minimal modern design.
- [ ] Run `npx tsc --noEmit` to verify no TypeScript errors.
- [ ] Run `yarn lint:fix`.
- [ ] Run `yarn format`.
- [ ] Document manual QA (or note that it was skipped).
- [ ] Prepare Conventional Commit message if the user asks for one.
- [ ] Summarize changes referencing file paths wrapped in backticks.
- [ ] Suggest logical next steps (tests, build, QA) in the final response when relevant.
