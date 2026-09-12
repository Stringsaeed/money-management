# Create Account device retest (#260 tip) — FAIL

- Tip under test: `ed1fc13bf8d291fc9a8ba0d49d15cecf5d8b6330` (PR #260 / `cursor/account-new-footer-hittest-b3d1`)
- Worktree under test: `/Users/saeed/Work/money-management` — `git rev-parse HEAD` = `ed1fc13bf8d291fc9a8ba0d49d15cecf5d8b6330`
- Bundle source: Metro from `apps/mobile` (`expo start --port 8081 --host lan`, cwd `/Users/saeed/Work/money-management/apps/mobile`). Not monorepo-root Metro.
- Device: iPhone 17 Pro `6E4BBB8A-790E-4DDD-995B-6A3D1D9101DB`
- App: `com.stringsaeed.moneymanagement` / Trove (Dev)
- Host: Muhammed's Mac (`saeed-personal.local`, Mac14,5)
- Session: agent-device `issue-232-17pro` (no stim)
- Auth: Signed-out banner after reload. Skipped Sign in / OTP. Cancelled AuthKit sheet. Local path reached Accounts → `/account/new` without OTP. Not BLOCKED_AUTH.
- Account name attempted: `RT Checking 1789228686y`
- SQLite `accounts` after attempts: still only prior `Z2 Device A` (no new `RT Checking` row)

## Attempts (max 3)

1. **AX / ref** `@e53` Create Account — miss; stayed on Add Account. Pre-tap attrs: `id=create-resource-submit`, `enabled=true`, **`hittable=false`**, rect `{x:17.67,y:780.67,w:367,h:42}`, center `(201, 802)`. Evidence: `create-account-pr260-pre-submit.png`, `create-account-pr260-after-ax.png`, `create-account-pr260-attrs-pre.txt`
2. **Coord center** `(201, 802)` — miss; form unchanged. Evidence: `create-account-pr260-after-coord.png`
3. **testID** `id=create-resource-submit` — miss; form unchanged. Evidence: `create-account-pr260-after-testid.png`, `create-account-pr260-fail-final.png`

## Control contrast

On the same `#260` `/account/new` screen, Savings type tap **did** update preview to `Savings · USD`. Only `create-resource-submit` no-op'd during the three attempts. After the sibling tap, attrs flipped to `hittable=true` (`create-account-pr260-attrs-post-sibling.txt`) — but the formal AX/coord/testID attempts already failed while **`hittable=false`**.

## Result / regression

**FAIL** — `#260` card + `CreateResourceFormScreen` footer does not restore Create Account taps on device.

**Regression vs #258:** tip `#258` recorded **`hittable=true`** with 3/3 miss; tip `#260` recorded **`hittable=false`** during the three submit attempts. Next fix iteration should treat the `hittable=false` signal explicitly.

Do not merge #260 (or #258) from this cert write.

Relates #232. Does not close #232 or #224.
