# Create Account device retest (#261 tip) — FAIL

- Tip under test: `c06f030c8c612475320f17bc7b83170b4a8a46b1` (PR #261 / `cursor/create-account-footer-outside-kav-b3d1`)
- Worktree under test: `/Users/saeed/Work/money-management` — `git rev-parse HEAD` = `c06f030c8c612475320f17bc7b83170b4a8a46b1`
- Bundle source: Metro from `apps/mobile` (`expo start --port 8081 --host lan --clear`, cwd `/Users/saeed/Work/money-management/apps/mobile`). Not monorepo-root Metro.
- Device: iPhone 17 Pro `6E4BBB8A-790E-4DDD-995B-6A3D1D9101DB`
- App: `com.stringsaeed.moneymanagement` / Trove (Dev)
- Host: Muhammed's Mac (`saeed-personal.local`, Mac14,5)
- Session: agent-device `issue-232-17pro` (no stim)
- Auth: Signed-out banner. Skipped Sign in / OTP. Local path reached Accounts → `/account/new` without OTP. Not BLOCKED_AUTH.
- Account name attempted: `RT Checking 1789229851`
- SQLite `accounts` after attempts: still only prior `Z2 Device A` (no new `RT Checking 1789229851` row)

## Pre-submit attrs (`create-resource-submit`)

`enabled=true`, **`hittable=true`**, rect `{x:17.67,y:780.67,w:367,h:42}`, center `(201,802)`, `id=create-resource-submit`, label `Create Account`.

Evidence: `create-account-pr261-attrs-pre.txt`, `create-account-pr261-pre-submit.png`

## Attempts (max 3)

1. **AX / id** `press id=create-resource-submit` — selector did not match (MISS); form unchanged. Evidence: `create-account-pr261-after-ax.png`
2. **Coord center** `(201, 802)` — MISS; form unchanged (`settled … unchanged`). Evidence: `create-account-pr261-after-coord.png`
3. **testID** `press id=create-resource-submit` — selector did not match (MISS); form unchanged. Evidence: `create-account-pr261-after-testid.png`, `create-account-pr261-fail-final.png`

## Result / regression

**FAIL** — footer-outside-KAV tip still does not create an account on device (screen stays on Add Account; no SQLite row).

**vs prior tips:** `#258` had `hittable=true` + 3/3 miss; `#260` had `hittable=false` + 3/3 miss; `#261` restores **`hittable=true`** but still 3/3 miss (AX/testID press selectors fail to resolve despite `get attrs id=…` succeeding; coord center also no-ops).

Do not merge #261 (or #260 / #258) from this cert write.

Relates #232. Does not close #232 or #224.
