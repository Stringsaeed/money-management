# Create Account Pressable retest (#254) — BLOCKED

- Tip under test: `20271b21ec0e32623e3adf4f170152ea7e86c120` (`fix(mobile): Pressable create-resource sheet submit (#254)`)
- Worktree: `/Users/saeed/Work/money-management-wt-main252`
- Device: iPhone 17 Pro `6E4BBB8A-790E-4DDD-995B-6A3D1D9101DB`
- App: `com.stringsaeed.moneymanagement` / Trove (Dev)
- Metro: LAN `:8081` status 200
- Session: agent-device `pressable-252`
- Auth: signed in (`stringsaeed@gmail.com`), personal sync on (`🪪 Your personal ledger syncs`) — no OTP
- Account name attempted: `RT Checking 20260912-075324`

## Attempts (max 3)

1. **AX** `Create Account` / `@ref` — miss (keyboard still up; typing predictions changed only). Evidence: `create-account-before-submit.png`, `create-account-after-ax-miss.png`
2. **Coord center** of button rect `(201, 802)` after keyboard dismissed via keyboard `next` — miss; sheet unchanged. Evidence: `create-account-before-coord.png`, `create-account-after-coord.png`
3. **testID** `id=create-resource-submit` — miss; same center tap `(201, 802)`; sheet unchanged; accounts list still empty. Evidence: `create-account-before-testid.png`, `create-account-after-testid.png`, `create-account-blocked-final.png`

AX attrs after keyboard dismiss: `identifier=create-resource-submit`, `hittable=true`, `enabled=true`, rect `{x:31.67,y:780.67,w:339,h:42}`.

## Result

**BLOCKED** — Create Account submit did not fire after 3 distinct attempts. Round-trip not reached.

Relates #232. Does not close #232 or #224.
