# One-device personal sync round-trip — BLOCKED

**Verdict: BLOCKED** (NativeHost Create Account hit-test miss)

| Field | Value |
| --- | --- |
| Prior PASS tip | `fb8c786` (Pressable personal upload) |
| Device | iPhone 17 Pro `6E4BBB8A-790E-4DDD-995B-6A3D1D9101DB` |
| Metro | LAN `192.168.1.123:8081` / worktree `money-management-wt-main252` |
| Sync state | Enabled — `🪪 Your personal ledger syncs` |
| Blocker | Add Account sheet **Create Account** button (`hittable=false`) — same NativeHost miss class as pre-#253 confirm |
| Closes | **Never** Closes/Fixes #232 or #224 — Relates only |

## What worked

1. Personal sync already enabled on Profile.
2. Opened Accounts → Add Account sheet.
3. Filled name `RT Checking rt-073109`.

## Three hit paths (once each) — all FAIL

1. Keyboard Return/Done after name focus → only `next` available; dismissed keyboard; form unchanged.
2. `agent-device activate` — **unknown command**; AX `press @e59` / label Create Account — settle unchanged.
3. Coordinate press center of JSON rect `(201, 805)` from `{x:31.67,y:787.67,w:339,h:35}` — settle unchanged; `hittable=false`.

## Evidence

- `roundtrip-blocked-sync-enabled.png` — sync enabled before round-trip
- `roundtrip-blocked-pre-create.png` — Add Account with name filled; Create Account visible
- `roundtrip-blocked-after-3attempts.png` — still on form after 3 attempts

## Needed

Pressable (or non-NativeHost) footer for Create Account — same pattern as #253 personal upload confirm. Round-trip matrix row blocked until Create Account is tappable.
