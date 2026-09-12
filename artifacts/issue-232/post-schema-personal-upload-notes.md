# Post-schema personal upload (Relates #232 only)

Device: iPhone 17 Pro `6E4BBB8A-790E-4DDD-995B-6A3D1D9101DB` (no stim)
App: `com.stringsaeed.moneymanagement`
Never Closes #232 / #224.

## Sequence that worked for probe + confirm control

1. `agent-device click 'role=button text="Sync just for me"' --settle` → Checking cloud…
2. Offer: **Upload to your cloud?** / **Upload once to cloud** / **Not now**
3. `agent-device click 'id="confirm-personal-upload"'` (also confirmed via settle on confirm5)

## Observed outcome (honest)

- Confirm control **was** targeted (`id="confirm-personal-upload"`), not `cancel-personal-upload` / Not now.
- Immediate next UI: back to **idle** (`Sync just for me` + empty-cloud copy).
- Never observed **Backing up… / Uploading… / Verifying… / Connecting… / Synced**.
- No client error banner (`Try again`).
- Sanitized agent-device network dump: **no** `commands/apply` / `migration.getManifest` lines after confirm (WorkOS/PostHog only in one window).
- Aligns with CF observability: **zero** `commands/apply` in recent window.

## Verdict

**PARTIAL** — confirm_upload offer reachable post-schema; confirm control exercised; upload pipeline (UI progress + `commands/apply`) **not** observed.

## Key artifacts

- `authkit-102-postschema-upload-offer.png` (earlier offer)
- `authkit-104-postschema-upload-once.png` (prior ambiguous tap → idle)
- `authkit-131-confirm5-offer.png` / `agent-device-offer-confirm5.txt`
- `agent-device-tap-confirm5.txt` (Tapped id=confirm-personal-upload → idle)
- `authkit-140-confirm6-offer.png` / `agent-device-tap-confirm6.txt` / `authkit-141-confirm6-*.png` (rapid poll still idle)
- `network-confirm5-sanitized.txt`, `app-log-confirm5-sanitized.txt`, `metro-confirm6-sanitized.txt`
