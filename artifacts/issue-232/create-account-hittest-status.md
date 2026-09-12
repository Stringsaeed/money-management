# Create Account hit-test status (Relates #232)

Updated: 2026-09-12T16:01:21Z

## PASS (prior)

- Personal upload confirm (Pressable): **PASS** at cert tip `fb8c78656551a4e756061d81a15a9d21a783ce1f`.

## Create Account / one-device round-trip

| Candidate | Tip | Device result | Notes |
| --- | --- | --- | --- |
| #254 Pressable | merged | BLOCKED / superseded | |
| #255 NativeHost | draft | BLOCKED / superseded | |
| #256 pan-disable | `c9a3ca89c00b3a8059d5abb7c136b790d6a7a7ef` | Metro-confirmed **MISS** | cert evidence `9e3f69f` |
| #257 portal | superseded | not retested | |
| #258 screen route | `709acf85250c02c8f9746c544da67f0c49f99233` | **FAIL** | 3/3 miss with `hittable=true`; evidence `create-account-pr258-fail.md`. Do not merge #258. |
| **#260 footer / card** | `ed1fc13bf8d291fc9a8ba0d49d15cecf5d8b6330` | **FAIL** | Mac agent-device iPhone 17 Pro; Metro `apps/mobile`; 3/3 miss with **`hittable=false`** (regression vs #258 `hittable=true`); sibling Savings worked; no SQLite row; evidence `create-account-pr260-fail.md`. **Not PASS.** Do not merge #260. |

## Owner next

1. New Create Account hit-test fix must address **`hittable=false`** on `#260` footer (not only press-while-hittable=true miss from `#258`).
2. On a future device PASS: Relates stamp on #241, then consider merge of the fixing PR.
3. Keep #232/#224 open until full matrix acceptance.
