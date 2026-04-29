# Manila

Expo Router money management app with Jest + React Native Testing Library coverage gates.

## Get started

1. Install dependencies

   ```bash
   pnpm install
   ```

2. Start the app

   ```bash
   pnpm start
   ```

## Testing

Use these scripts locally:

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
pnpm test:ci
```

`pnpm test:ci` is the pre-merge gate and the command used in CI.

Current policy:

- touched business-logic files ship with tests in the same PR
- new pure utilities should keep file coverage at 100%
- coverage thresholds are staged upward over time rather than dropped opportunistically

## Verification

Before merging:

```bash
pnpm test:ci
npx tsc --noEmit
pnpm lint:fix
pnpm format
```
