# Post-schema personal upload (Relates #232 only)

Device: iPhone 17 Pro `6E4BBB8A-790E-4DDD-995B-6A3D1D9101DB` (no stim)
App: `com.stringsaeed.moneymanagement`
Never Closes #232 / #224.

## Sequence that worked for probe + offer

1. Settings → Personal ✓ (`select-ledger-personal` / Personal ledger selected)
2. `agent-device click 'role=button text="Sync just for me"' --settle` → Checking cloud…
3. Offer: **Upload to your cloud?** / **Upload once to cloud** (`@e19`) / **Not now** (`@e20`)

## confirm7 (label click — this follow-up)

- Tapped: `role=button text="Upload once to cloud"` → reported hit `(201, 530)`
- Immediate settle: offer nodes removed (`Upload once` + `Not now`) → **idle** (`Sync just for me`)
- Never observed **Backing up… / Uploading… / Verifying… / Connecting… / Synced / Try again**
- Same idle outcome as prior `id=confirm-personal-upload` taps (confirm5/6 / nav)

## Hit-target suspicion

Offer snapshot frames both controls adjacent:

- `@e18` [other] / `@e19` [button] **"Upload once to cloud"**
- `@e20` [button] **"Not now"**

Label match claims Upload-once, but post-tap UI matches **cancel → idle** (no busy states, no `commands/apply`). Suspect shared Host / overlapping hit-target so cancel onPress wins. Parallel fix: split confirm/cancel into separate `NativeHost`s.

## Earlier (3010d6d) notes still apply

- Sanitized client network: **no** `commands/apply` after confirm taps
- CF observability: **zero** `commands/apply` in that window

## Verdict

**PARTIAL** — empty-cloud offer reachable; idle CTA + label/id confirm taps exercised; upload pipeline (busy UI + Synced + `commands/apply`) **not** observed. Host hit-target suspicion documented.

## Key artifacts (confirm7)

- `confirm7-offer.txt` / `authkit-149-confirm7-offer.png` — both buttons visible
- `confirm7-click.txt` — Tapped role=button text="Upload once to cloud" (201, 530) → idle
- `confirm7-after.txt` / `authkit-150-confirm7-after.png` — idle after tap
- `offer-nav.txt` / `nav-click-confirm.txt` — prior id-confirm → idle (same pattern)
