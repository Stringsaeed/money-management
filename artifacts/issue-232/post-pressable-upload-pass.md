# Post-Pressable personal upload retest (PASS)

**Verdict: PASS**

| Field | Value |
| --- | --- |
| Main tip under test | `04461d5011980319463d9736acf922eac1ae6f65` (`fix(mobile): use Pressable for personal upload confirm/cancel` / #253) |
| Device | iPhone 17 Pro sim `6E4BBB8A-790E-4DDD-995B-6A3D1D9101DB` |
| Bundle | `com.stringsaeed.moneymanagement` (Trove Dev) |
| Metro | LAN `192.168.1.123:8081` from worktree `money-management-wt-main252` |
| Auth | Session reuse after Profile **Sign in again** → Continue with email code → WorkOS Continue; **no OTP** |
| Stim | none |
| Closes | **Never** Closes/Fixes #232 or #224 — Relates only |

## Flow evidence

1. Profile & household → Sync just for me → confirm offer **Upload to your cloud?**
2. Pressable **Upload once to cloud** (`confirm-personal-upload`) tapped once — not Not now
3. Immediate transition to **Uploading…** (disabled busy button)
4. End state: **🪪 Your personal ledger syncs** (`status === enabled` / `alreadyEnabled`)

## Screenshots

- `pressable-199-signed-in.png` — signed in as stringsaeed@gmail.com
- `pressable-200-confirm-offer.png` — confirm offer with Pressable Upload once to cloud
- `pressable-201-uploading.png` — Uploading… after confirm
- `pressable-202-synced.png` — enabled copy (personal ledger syncs)

Backing up… was not captured as a distinct AX frame (transitioned quickly into Uploading…); confirm→Uploading→enabled is enough to clear the prior NativeHost idle FAIL.
