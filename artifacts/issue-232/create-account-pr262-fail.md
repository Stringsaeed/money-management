# Create Account device retest (#262 tip) — FAIL

- Tip under test: `be2992c56c701722a0eef3c530dd05aa1c7eac8e` (PR #262 / `cursor/create-account-inscroll-footer-b3d1`)
- Worktree under test: `/Users/saeed/Work/money-management` — `git rev-parse HEAD` = `be2992c56c701722a0eef3c530dd05aa1c7eac8e`
- Bundle source: Metro from `apps/mobile` (`pnpm exec expo start --port 8081 --host lan --clear`, cwd `/Users/saeed/Work/money-management/apps/mobile`). Not monorepo-root Metro.
- Device: iPhone 17 Pro `6E4BBB8A-790E-4DDD-995B-6A3D1D9101DB`
- App: `com.stringsaeed.moneymanagement` / Trove (Dev)
- Host: Muhammed's Mac (`saeed-personal.local`, Mac14,5)
- Session: agent-device `issue-232-pr262` (no stim)
- Auth: Signed-out banner. Skipped Sign in / OTP. Local path reached `/account/new` via `trove://account/new` without OTP. Not BLOCKED_AUTH.
- Account name attempted: `RT Checking 1789231485`
- SQLite `accounts` after attempts: still only prior `Z2 Device A` (no new `RT Checking 1789231485` row)

## Pre-submit attrs (`create-resource-submit`)

`enabled=true`, **`hittable=true`**, rect `{x:17.67,y:780.67,w:367,h:42}`, center `(201,802)`, `id=create-resource-submit`, label `Create Account`.

Evidence: `create-account-pr262-attrs-pre.txt`, `create-account-pr262-pre-submit.png`

## Attempts (max 3)

1. **AX / id** `press id=create-resource-submit` — selector did not match (MISS); form unchanged. Evidence: `create-account-pr262-after-ax.png`
2. **Coord center** `(201, 802)` — MISS; form unchanged (`settled … unchanged`). Evidence: `create-account-pr262-after-coord.png`
3. **testID** `press id="create-resource-submit"` / `id=create-resource-submit` — selector did not match (MISS); form unchanged. Evidence: `create-account-pr262-after-testid.png`, `create-account-pr262-fail-final.png`

## Result / regression

**FAIL** — in-ScrollView footer + unmount closed currency BottomSheet Host tip still does not create an account on device (screen stays on Add Account; no SQLite row).

**vs prior tips:** `#258`/`#261` had `hittable=true` + 3/3 miss; `#260` had `hittable=false` + 3/3 miss; `#262` still **`hittable=true`** + 3/3 miss (AX/testID press selectors fail to resolve despite `get attrs id=…` succeeding; coord center also no-ops).

Do not merge #262 (or #261 / #260 / #258) from this cert write.

Relates #232. Does not close #232 or #224.
