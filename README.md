# Manila

Expo Router money management app with Jest + React Native Testing Library coverage gates.

## Get started

1. Install dependencies

   ```bash
   yarn install
   ```

2. Start the app

   ```bash
   yarn start
   ```

## Testing

Use these scripts locally:

```bash
yarn test
yarn test:watch
yarn test:coverage
yarn test:ci
```

`yarn test:ci` is the pre-merge gate and the command used in CI.

Current policy:

- touched business-logic files ship with tests in the same PR
- new pure utilities should keep file coverage at 100%
- coverage thresholds are staged upward over time rather than dropped opportunistically

## Verification

Before merging:

```bash
yarn test:ci
npx tsc --noEmit
yarn lint:fix
yarn format
```
