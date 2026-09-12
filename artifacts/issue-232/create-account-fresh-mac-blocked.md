# Create Account fresh Mac retest (#256 tip) — BLOCKED

- Tip under test: `c9a3ca89c00b3a8059d5abb7c136b790d6a7a7ef` (PR #256 / `cursor/create-account-hittest2-b3d1`)
- Worktree: `/Users/saeed/Work/money-management-wt-hittest256` — `git rev-parse HEAD` = `c9a3ca89c00b3a8059d5abb7c136b790d6a7a7ef`
- Bundle source: Metro **confirmed** from this worktree (`pnpm exec expo start --port 8081 --host lan`, PID 19118 cwd `.../money-management-wt-hittest256`). **Not** a stale-bundle from another checkout.
- Tip code check: `create-resource-bottom-sheet.tsx` has `detents={[programmatic(0), "content"]}` at this SHA.
- Device: iPhone 17 Pro `6E4BBB8A-790E-4DDD-995B-6A3D1D9101DB`
- App: `com.stringsaeed.moneymanagement` / Trove (Dev)
- Metro: LAN `:8081` status OK (`packager-status:running`)
- Session: agent-device `issue-232-17pro` (closed prior `hittest-256`)
- Auth: reused signed-in session; Add Account sheet already open on Accounts
- Account name attempted: `RT Checking 1789188305`

## Attempts (max 3)

1. **AX / ref** `@e59` Create Account — miss; **sheet stayed open**; accounts list still `No accounts yet`. Evidence: `create-account-fresh-mac-before.png`, `create-account-fresh-mac-after-ref.png`
2. **Coord center** `(201, 802)` of button rect — miss; **sheet stayed open**. AX attrs before this tap: `identifier=create-resource-submit`, `enabled=true`, **`hittable=false`**, rect `{x:31.67,y:780.67,w:339,h:42}`. Evidence: `create-account-fresh-mac-before-coord.png`, `create-account-fresh-mac-after-coord.png`
3. **testID** `id=create-resource-submit` — miss; same center tap `(201, 802)`; **sheet stayed open**. After tap, `get attrs id=create-resource-submit` showed `enabled=true`, **`hittable=true`**, same rect — still no close/create. Evidence: `create-account-fresh-mac-before-testid.png`, `create-account-fresh-mac-after-testid.png`, `create-account-fresh-mac-blocked-final.png`

## Result

**BLOCKED** — After all three tap methods (ref, coord, testID), the Add Account sheet remained open and no account was created. Round-trip (txn / Synced / relaunch) not reached. Bundle was #256 tip with `programmatic(0)`; failure is not explained by Metro serving a wrong checkout.

Relates #232. Does not close #232 or #224.
