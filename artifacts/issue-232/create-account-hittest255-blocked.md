# Create Account hit-test retest (#255) — BLOCKED

- Tip under test: `a323ebff97bec8add31c1105fb93cae948ba204d` (`fix(mobile): NativeHost create-resource submit for sheet taps` / PR #255)
- Worktree: `/Users/saeed/Work/money-management-wt-hittest255`
- Device: iPhone 17 Pro `6E4BBB8A-790E-4DDD-995B-6A3D1D9101DB`
- App: `com.stringsaeed.moneymanagement` / Trove (Dev)
- Metro: LAN `:8081` status 200 (hittest255 tip)
- Session: agent-device `hittest-255`
- Auth: reused signed-in session (no OTP); Add Account sheet open on Accounts
- Account name attempted: `RT Checking 20260912-081617`

## Attempts (max 3)

1. **AX** `Create Account` / `@e59` — miss; sheet unchanged (`No accounts yet`). Evidence: `create-account-hittest255-before-submit.png`, `create-account-hittest255-after-ax.png`
2. **Coord center** `(201, 802)` of button rect — miss; sheet unchanged. Evidence: `create-account-hittest255-before-coord.png`, `create-account-hittest255-after-coord.png`
3. **testID** `id=create-resource-submit` — miss; same center tap `(201, 802)`; sheet unchanged. Evidence: `create-account-hittest255-before-testid.png`, `create-account-hittest255-after-testid.png`, `create-account-hittest255-blocked-final.png`

AX attrs after keyboard dismiss (attempt 1 path): `identifier=create-resource-submit`, `enabled=true`, rect `{x:31.67,y:780.67,w:339,h:42}`; mid-run `hittable` flipped false→true across attempts, but taps never closed the sheet.

## Result

**BLOCKED** — Create Account submit did not fire after 3 distinct attempts. Round-trip not reached.

Relates #232. Does not close #232 or #224.
