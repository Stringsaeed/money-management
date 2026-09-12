# Create Account device retest (#258 tip) — FAIL

- Tip under test: `709acf85250c02c8f9746c544da67f0c49f99233` (PR #258 / `cursor/create-account-screen-b3d1`)
- Worktree: `/Users/saeed/Work/money-management` — `git rev-parse HEAD` = `709acf85250c02c8f9746c544da67f0c49f99233`
- Bundle source: Metro from `apps/mobile` (`pnpm exec expo start --port 8081 --host lan`, cwd confirmed `/Users/saeed/Work/money-management/apps/mobile`). Not monorepo-root Metro.
- Device: iPhone 17 Pro `6E4BBB8A-790E-4DDD-995B-6A3D1D9101DB`
- App: `com.stringsaeed.moneymanagement` / Trove (Dev)
- Host: Muhammed's Mac (`saeed-personal.local`, Mac14,5)
- Session: agent-device `issue-232-17pro` (no stim)
- Auth: WorkOS session was remotely revoked after Metro restart. No app Keychain session to reuse. No `CERT_USER_*` env. Local navigation still reached Accounts → `/account/new` without OTP. Personal sync banner not restored. Not BLOCKED_AUTH.
- Account name attempted: `RT Checking 1789227168y`
- SQLite `accounts` after attempts: still only prior `Z2 Device A` (no new row)

## Attempts (max 3)

1. **AX / ref** `@e52` Create Account — miss; modal stayed on Add Account. Pre-tap attrs: `id=create-resource-submit`, `enabled=true`, **`hittable=true`**, rect `{x:17.67,y:814.67,w:367,h:42}`, center `(201, 836)`. Evidence: `create-account-pr258-before-ax.png`, `create-account-pr258-after-ax.png`
2. **Coord center** `(201, 836)` — miss; form unchanged. Evidence: `create-account-pr258-before-coord.png`, `create-account-pr258-after-coord.png`
3. **testID** `id=create-resource-submit` — miss; still `hittable=true`, same rect; no create. Evidence: `create-account-pr258-before-testid.png`, `create-account-pr258-after-testid.png`, `create-account-pr258-fail-final.png`

## Control contrast

On the same `#258` `/account/new` screen, other controls **did** receive taps (color `#2ECC71` selected; Savings type changed preview to `Savings · USD`). Only `create-resource-submit` no-op'd.

## Result

**FAIL** — Expo Router modal screen path does not fix device Create Account hit-testing. Round-trip not reached. Do not merge #258 from this cert write.

Relates #232. Does not close #232 or #224.
