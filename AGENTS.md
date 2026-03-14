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

- Use Bun for every script (`bun install`, `bun run ...`); avoid npm/yarn even though README still lists npm.
- Use `date-fns` for date parsing, formatting, arithmetic, and interval logic; do not hand-roll date math or ad-hoc `Date` utilities.
- Core scripts: `bun run start`, `bun run ios`, `bun run android`, `bun run web` for Expo entry points.
- Reset starter code (rare) via `bun run reset-project`, which moves the current app to `app-example/`.
- Lint with `bun run lint` (oxlint) but always finish work by running `bun run lint:fix` followed by `bun run format` (oxfmt).
- Formatting check only: `bun run format:check` if you need CI parity without rewriting files.
- There is no dedicated build step; Expo bundler handles builds per platform when invoking the platform-specific start scripts.
- Tests are not configured yet; document manual QA in PR descriptions and focus on lint + runtime smoke tests.
- Single-test workflow: once a Jest/Vitest runner exists, prefer `bun test path/to/file.test.tsx`; until then state "no automated tests" in reports.
- Use `bunx expo-doctor` or `bunx expo install` only if health checks demand it—otherwise keep dependencies stable.
- Shell access: prefer specialized helpers (Read/Glob/Grep) for file IO; reserve Bash for git, bun, or runtime commands.
- Never invoke destructive git commands (`reset --hard`, `checkout --`) without the user’s explicit order.

## Workflow Expectations

- Start by skimming AGENTS.md and this file to refresh requirements for linting, formatting, skills, and Expo architecture.
- Before writing code, gather context with `glob`, `read`, or `grep`; inspect related files rather than editing blind.
- Apply single-file modifications with `apply_patch` when practical; avoid it for generated code or mass rewrites.
- After editing, rerun `bun run lint:fix && bun run format` even if linters previously passed—this is mandatory per AGENTS.md.
- Document any skipped steps (e.g., simulator run) in the final response so the user knows what still needs verification.
- Avoid questions like "Should I proceed?"; instead pick the safest default, act, and mention the assumption afterward.
- Keep commands succinct and never stream large logs; summarize key lines for the user.
- When referencing files to the user, wrap the repository-relative path in backticks so the CLI can hyperlink it.
- Tests are absent, but still mention manual QA, simulator smoke checks, or component stories when relevant.
- Emojis are encouraged in UI copy, labels, and decorative elements to reinforce the modern minimal design language; keep non-UI files (configs, scripts) ASCII-only.
- Respect user-owned dirty changes; do not format unrelated files even if the formatter would touch them.

## Repository Map

- `app/` holds Expo Router screens; `_layout.tsx` defines the root stack, `(tabs)/_layout.tsx` configures bottom tabs, `modal.tsx` exposes modal routes.
- Tab routes: `(tabs)/index.tsx` is the Home tab, `(tabs)/explore.tsx` is Explore; mimic their patterns for new tabs.
- `components/` hosts shared UI like `ThemedText`, `ThemedView`, `ParallaxScrollView`, `HapticTab`, and the platform-aware `ui/IconSymbol` bridge.
- `constants/theme.ts` defines color palettes and font stacks for light/dark; rely on the exported tokens instead of hard-coded hex values.
- `hooks/use-theme-color.ts` and `hooks/use-color-scheme.ts[x]` centralize theme lookups per platform; consult them before creating new theme helpers.
- `assets/` contains images/fonts; import static assets through Expo’s module system rather than `require` strings.
- `global.css`, `postcss.config.mjs`, and `uniwind-types.d.ts` set up Tailwind v4.
- `scripts/reset-project.js` resets the `app/` folder; never run it automatically because it moves files irreversibly.
- `constants/`, `hooks/`, and `components/` share the `@/*` alias (configured in `tsconfig.json`) so prefer `import Foo from "@/components/Foo"` over relative `../../` walks.
- `eslint.config.js`, `.oxlintrc.json`, and `.oxfmtrc.json` codify lint/format behavior; read them before changing stylistic conventions.
- No `.cursor/rules` or Copilot instruction files exist right now, so there are no external Cursor/Copilot constraints to mirror.

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
- Default naming: `PascalCase` for components/types, `camelCase` for functions/constants, `SCREAMING_SNAKE_CASE` for env fallback constants.
- Error messages should explain the impact and next action, not just restate that something failed.
- When defining React Navigation routes, leverage Expo Router file conventions instead of manual stack registration.
- Use `clsx` or `tailwind-merge` already installed when combining class strings for tailwind.
- Keep optional chaining and nullish coalescing in place of defensive `&&` ladders when reading nested data.
- Prefer `useMemo`/`useCallback` for heavy computations or callback props that feed deep hierarchies; otherwise skip premature memoization.
- Export a default component per screen file; named helpers can live in the same module but keep them near usage.
- For icons, use **phosphor-react-native**. Always import with the `Icon` suffix (e.g. `CaretRightIcon`, `GearIcon`) — the un-suffixed exports are deprecated and emit warnings. Use `weight={focused ? "fill" : "regular"}` to reflect active/inactive state.
- Keep `eqeqeq` behavior in mind: `==` is only acceptable where `smart` semantics cover `null == undefined`; otherwise use `===`.
- Do not mutate React state directly; clone arrays/objects or use functional updates.
- Avoid `require` for JSON/TS modules in TypeScript; use `import` statements so type checking works.

## Components & Theming

- Wrap visual blocks with `ThemedView` or `ThemedText` unless you have a compelling need for the raw React Native primitives.
- Colors come from `constants/theme.ts`; extend palettes there rather than scattering literals across files.
- Respect system color scheme detection via `useColorScheme`; when adding toggles, plumb them through the existing ThemeProvider in `app/_layout.tsx`.
- Layout spacing should follow an 8px baseline when possible; keep cross-platform parity by aligning with Tailwind spacing tokens.
- Use `ParallaxScrollView` for hero sections that need scroll-bound headers; do not reinvent parallax per screen.
- Haptics go through the `HapticTab` abstraction for tab interactions; use Expo Haptics elsewhere via centralized helpers.
- When styling with tailwind, keep classes deterministic—avoid interpolating strings or conditionally appending non-existent tokens.
- **No inline styles**: always use tailwind `className` props for styling; never use the `style` prop for layout or visual properties that tailwind can express.
- **Safe area**: every screen must respect safe areas. Use `safe-top` / `safe-bottom` tailwind classes (or `SafeAreaView` equivalent classes) on the outermost container of every screen so content is never obscured by notches or home indicators.
- **Animations on layout change**: whenever a layout-level change happens (list items added/removed, conditional panels, screen transitions), wrap affected elements in Reanimated `Animated.View` and apply `entering`/`exiting`/`layout` props from `react-native-reanimated` so all layout shifts animate smoothly.
- **Modern minimal design with emojis**: default to clean, minimal UI with generous whitespace. Prefer emojis over icon libraries for decorative or label purposes wherever they convey the intent clearly.
- Animations should rely on Reanimated v4; never mix imperative Animated API unless Reanimated cannot cover the case.
- Favor React Compiler friendly patterns (no dynamic hook order, no conditional hook definition) because the project has `reactCompiler` experiments on.
- When exporting SVG/bitmap assets, optimize them through `expo optimize` before committing.

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

- Automated tests are not set up yet; communicate this fact in your final response whenever testing is requested.
- Until Jest/Vitest exists, rely on manual QA: run `bun run ios` or `bun run android` where feasible, or `bun run web` for quick smoke checks.
- If you add a test runner, document its usage in this file and in `package.json` scripts for others.
- When adding tests later, prefer colocated `*.test.tsx` or `*.spec.ts` files near the unit under test.
- For single-test execution, run `bun test path/to/file.test.tsx` (Jest) or `bun test file --runInBand`; mention this pattern even if not yet wired up.
- Snapshot tests should target stable UI (icons, large layout) and live under a `__snapshots__` directory ignored by Metro.
- Keep Detox/E2E scripts separate from Expo start scripts to avoid simulator conflicts.
- Report any manual QA done (device, simulator, steps) so the user can reproduce issues or confirm fixes.
- When skipping runtime QA, explicitly mention why (no simulator, time constraints) and suggest what the user should run.

## Git & Collaboration

- Always create a commit after completing each task unless the user explicitly instructs otherwise.
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.) and keep messages focused on the "why".
- Run `git status`, `git diff`, and `git log` via the Bash tool, reporting summaries instead of full raw output when users ask.
- Never amend or force-push unless instructed; if a pre-commit hook rewrites files, create a new commit containing the updated changes.
- Do not stage or commit secrets (e.g., `.env`, credentials); warn the user if they request it.
- Respect users’ existing dirty files—avoid formatting or touching unrelated files to keep diffs minimal.
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
- [ ] Apply `safe-top` / `safe-bottom` classes on every screen's outermost container.
- [ ] Wrap layout-changing elements in Reanimated `Animated.View` with `entering`/`exiting`/`layout` props.
- [ ] Decompose into small, single-responsibility components; no large monoliths.
- [ ] Use emojis in UI copy and labels to reinforce minimal modern design.
- [ ] Run `bun run lint:fix`.
- [ ] Run `bun run format`.
- [ ] Document manual QA (or note that it was skipped).
- [ ] Prepare Conventional Commit message if the user asks for one.
- [ ] Summarize changes referencing file paths wrapped in backticks.
- [ ] Suggest logical next steps (tests, build, QA) in the final response when relevant.

<!-- HEROUI-NATIVE-AGENTS-MD-START -->
[HeroUI Native Docs Index]|root: ./.heroui-docs/native|STOP. What you remember about HeroUI Native is WRONG for this project. Always search docs and read before any task.|If docs missing, run this command first: heroui agents-md --native --output AGENTS.md|components/(buttons):{button.mdx,close-button.mdx}|components/(collections):{menu.mdx,tag-group.mdx}|components/(controls):{slider.mdx,switch.mdx}|components/(data-display):{chip.mdx}|components/(feedback):{alert.mdx,skeleton-group.mdx,skeleton.mdx,spinner.mdx}|components/(forms):{checkbox.mdx,control-field.mdx,description.mdx,field-error.mdx,input-group.mdx,input-otp.mdx,input.mdx,label.mdx,radio-group.mdx,search-field.mdx,select.mdx,text-area.mdx,text-field.mdx}|components/(layout):{card.mdx,separator.mdx,surface.mdx}|components/(media):{avatar.mdx}|components/(navigation):{accordion.mdx,list-group.mdx,tabs.mdx}|components/(overlays):{bottom-sheet.mdx,dialog.mdx,popover.mdx,toast.mdx}|components/(utilities):{pressable-feedback.mdx,scroll-shadow.mdx}|getting-started/(handbook):{animation.mdx,colors.mdx,composition.mdx,portal.mdx,provider.mdx,styling.mdx,theming.mdx}|getting-started/(overview):{design-principles.mdx,quick-start.mdx}|getting-started/(ui-for-agents):{agent-skills.mdx,agents-md.mdx,llms-txt.mdx,mcp-server.mdx}|releases:{beta-10.mdx,beta-11.mdx,beta-12.mdx,beta-13.mdx,rc-1.mdx,rc-2.mdx,rc-3.mdx,rc-4.mdx}
<!-- HEROUI-NATIVE-AGENTS-MD-END -->
