# Production PowerSync provisioning receipt

Date: 2026-09-08

Target: PowerSync Cloud project `trove`, instance `Production` (`6a9e0dd58453e7cf8334ea1f`), region `eu`.

The operator explicitly chose Europe for the production PowerSync placement. The instance was provisioned after the frozen D1 snapshot had been imported and verified on PlanetScale `trove/main`.

## Verification

- Configuration schema: pass.
- Direct PlanetScale connection: connected, with no reported errors.
- Sync Streams validation: pass after provisioning.
- Active Sync Streams version: `1`.
- Initial replication: complete.
- Replication slot: `powersync_6a9e0dd58453e7cf8334ea1f_1_1ab9`.
- Replication lag: `0` bytes.
- Tables: all 13 publication tables recognized with text `id` replication keys and no table errors.
- Liveness probe: HTTP 200.
- Readiness probe: HTTP 200.

The production endpoint, production-only ES256 private key, and key ID were stored as GitHub Actions secrets `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, and `POWERSYNC_JWT_KID`. The matching public JWK is configured on this PowerSync instance. The local private-key file and temporary service configuration were deleted after secret storage.

EAS production now exposes `EXPO_PUBLIC_SERVER_URL=https://auth.trove.ing` to production builds. The existing D1-backed Worker remains write-frozen through `KILL_SWITCH_LOCAL_ONLY=on`; provisioning PowerSync did not deploy or alter that Worker.
