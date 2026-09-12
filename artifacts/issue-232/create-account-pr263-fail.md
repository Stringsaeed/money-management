# Create Account device retest (#263 tip) — FAIL

- Tip under test: `150cb4894e9e3e237f1ce29029e47747f4dc2e30` (PR #263 / `cursor/create-account-no-expo-ui-sheet-b3d1`)
- Worktree under test: `/Users/saeed/Work/money-management` — HEAD `150cb4894e9e3e237f1ce29029e47747f4dc2e30`
- Metro: reused healthy `:8081` (no restart this pass)
- Device: iPhone 17 Pro `6E4BBB8A-790E-4DDD-995B-6A3D1D9101DB`
- Host: `saeed-personal.local`
- Session: agent-device only (no stim)
- Auth: Signed-out banner dismissed. Local `trove://account/new`. Not BLOCKED_AUTH.
- Account name: `RT Checking 1789235362`
- SQLite `accounts`: still only `Z2 Device A` (no new row)

## Pre-submit attrs

`enabled=true`, `hittable=true`, rect `{x:35.33,y:730.33,w:332,h:42}`, center `(201,751)`, id `create-resource-submit`.

## Attempts

1. AX `press id=create-resource-submit` → `(201,751)` — MISS
2. Coord `(201,751)` — MISS
3. testID `press id=create-resource-submit` — MISS

Relates #232. Does not close #232 or #224.
