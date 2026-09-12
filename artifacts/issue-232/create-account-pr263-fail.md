# Create Account device cert — PR #263 — FAIL BLOCKED_METRO

- Verdict: FAIL BLOCKED_METRO (infra; hit-test not reached)
- Under test: PR #263 tip `150cb4894e9e3e237f1ce29029e47747f4dc2e30` (`cursor/create-account-no-expo-ui-sheet-b3d1`)
- Host: saeed-personal.local
- Device: iPhone 17 Pro `6E4BBB8A-790E-4DDD-995B-6A3D1D9101DB`
- Bundle: `com.stringsaeed.moneymanagement`
- Scheme / deep link: `trove` / `trove://account/new`
- Submit testID: `create-resource-submit`
- Metro: initial restart false-up then died; one recovery (tmux missing) → METRO_DOWN_AFTER_60S. No third restart.
- Evidence: `create-account-pr263-metro-refused.png`, `create-account-pr263-blocked-final.png`, `create-account-pr263-metro.log`

Relates #232 only.
