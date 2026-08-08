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

## Over-the-air updates

EAS Update publishes to the `preview` and `production` channels. Always pass the matching
`--environment` so Expo SDK 57 loads the intended EAS environment variables while creating the
update manifest.

`EXPO_PUBLIC_OTA_UPDATE_MANDATORY` is public metadata, not a secret. The app treats only the exact
string `true` as mandatory; an unset variable and every other value default to `false`.

Publish an optional preview update:

```bash
eas env:create preview --name EXPO_PUBLIC_OTA_UPDATE_MANDATORY --value false --visibility plaintext --force
eas update --channel preview --environment preview --message "Describe the preview update"
```

Publish a mandatory preview update, then immediately reset the environment for future publishes:

```bash
eas env:create preview --name EXPO_PUBLIC_OTA_UPDATE_MANDATORY --value true --visibility plaintext --force
eas update --channel preview --environment preview --message "Describe the mandatory preview update"
eas env:create preview --name EXPO_PUBLIC_OTA_UPDATE_MANDATORY --value false --visibility plaintext --force
```

Publish an optional production update:

```bash
eas env:create production --name EXPO_PUBLIC_OTA_UPDATE_MANDATORY --value false --visibility plaintext --force
eas update --channel production --environment production --message "Describe the production update"
```

Publish a mandatory production update, then immediately reset the environment for future
publishes:

```bash
eas env:create production --name EXPO_PUBLIC_OTA_UPDATE_MANDATORY --value true --visibility plaintext --force
eas update --channel production --environment production --message "Describe the mandatory production update"
eas env:create production --name EXPO_PUBLIC_OTA_UPDATE_MANDATORY --value false --visibility plaintext --force
```

The mandatory value is captured in that update's manifest, so resetting the EAS environment does
not change an update that was already published. Keep the flag at `false` unless a specific publish
must block deferral.

OTA updates can only target installed binaries with a compatible runtime version. This project uses
the app version as its runtime version, so changes to native dependencies, native configuration, or
the runtime version require a new EAS build and store/internal distribution rather than an OTA
publish. A mandatory OTA flag also cannot enforce behavior in older binaries that do not yet contain
the mandatory-update handler.

## Verification

Before merging:

```bash
pnpm test:ci
npx tsc --noEmit
pnpm lint:fix
pnpm format
```
