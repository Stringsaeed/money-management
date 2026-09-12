# Create Account hit-test status (Relates #232)

Updated: 2026-09-12T06:03:43Z

## PASS (prior)

- Personal upload confirm (Pressable): **PASS** at cert tip `fb8c78656551a4e756061d81a15a9d21a783ce1f`.

## Create Account / one-device round-trip

| Candidate | Tip | Device result | Notes |
| --- | --- | --- | --- |
| #254 Pressable | merged | BLOCKED / superseded | |
| #255 NativeHost | draft | BLOCKED / superseded | |
| #256 pan-disable | `c9a3ca89c00b3a8059d5abb7c136b790d6a7a7ef` | Metro-confirmed **MISS** | cert evidence `9e3f69f` |
| #257 portal | superseded | not retested | |
| **#258 screen route** | `709acf85250c02c8f9746c544da67f0c49f99233` | **BLOCKED** | Draft; all product CI green; Expo preview live; Mac automation ghosting / money-management worker offline. Manual iPhone 17 Pro `/account/new` still required. **Not PASS.** Do not merge from cert write. |

## Owner next

1. Restart money-management Mac Cursor worker **or** manually verify Create Account on iPhone 17 Pro at `/account/new` against #258 preview/build.
2. On device PASS: Relates stamp on #241, then merge #258.
3. Keep #232/#224 open until full matrix acceptance.
