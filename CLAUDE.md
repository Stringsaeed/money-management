# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Use **bun** as the package manager (bun.lock is present).

```bash
bun run start        # Start Expo dev server
bun run ios          # Run on iOS simulator
bun run android      # Run on Android emulator/device
bun run web          # Run in browser
bun run lint         # Run ESLint
bun run reset-project  # Reset app/ to blank (moves current to app-example/)
```

No test suite is configured yet.

## Architecture

This is an **Expo cross-platform app** (iOS, Android, Web) using file-based routing via Expo Router.

**Key stack:**

- React 19 + React Native 0.83 + TypeScript (strict mode)
- Expo 55 with plugins: expo-router, expo-splash-screen, expo-font, expo-image, expo-web-browser
- react-native-reanimated v4 for animations
- Experiments enabled: `typedRoutes`, `reactCompiler`

**Path alias:** `@/*` maps to the project root.

**Routing (app/):**

- `_layout.tsx` — Root stack with `ThemeProvider` (light/dark)
- `(tabs)/_layout.tsx` — Bottom tab navigator
- `(tabs)/index.tsx` — Home tab
- `(tabs)/explore.tsx` — Explore tab
- `modal.tsx` — Modal screen

**Theming:**

- `constants/theme.ts` — Color palettes and fonts for light/dark modes
- `hooks/use-theme-color.ts` — Resolves themed colors per platform
- `hooks/use-color-scheme.ts` / `hooks/use-color-scheme.web.ts` — Platform-specific color scheme detection

**Components (`components/`):**

- `ThemedText`, `ThemedView` — Theme-aware wrappers
- `ui/IconSymbol` — SF Symbols / MaterialIcons bridge (platform-specific: `.ios.tsx` vs `.tsx`)
- `ParallaxScrollView` — Parallax header scroll container
- `HapticTab` — Tab bar button with haptic feedback

**Platform-specific files** follow the `.ios.tsx` / `.web.ts` convention used by Expo (Metro resolver picks them automatically).

## Skills

Always invoke installed skills relevant to the task before writing code:

- **Expo / React Native work:** `expo-app-design:building-ui`, `expo-app-design:data-fetching`, `expo-app-design:tailwind-setup`, `expo-app-design:api-routes`, `expo-app-design:use-dom`, `expo-deployment:deployment`, `expo-deployment:cicd-workflows`, `upgrading-expo:upgrading-expo`
- **React Native performance:** `react-native-best-practices`, `vercel-react-native-skills`
- **React / Next.js:** `vercel-react-best-practices`, `vercel-composition-patterns`

## Workflow

Always commit changes after they are accepted by the user. Use [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages (e.g. `feat:`, `fix:`, `chore:`, `refactor:`).
