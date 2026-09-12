# Create Account hit-test status (Relates #232)

Concise stamp for the acceptance matrix. No secrets. **Never** Closes/Fixes #232 or #224.

| Item | Status | Tip / note |
| --- | --- | --- |
| Personal upload (Pressable confirm) | **PASS** | Cert tip `fb8c786` — `post-pressable-upload-pass.md` |
| Create Account / one-device round-trip | **BLOCKED** | Still blocked on device after #254 / #255 / #256; **do not claim PASS** |
| #256 Metro-confirmed miss | **MISS** | Tip `c9a3ca8` — `create-account-fresh-mac-blocked.md`; cert evidence tip `9e3f69f` |
| Superseded candidates | superseded | [#257](https://github.com/Stringsaeed/money-management/pull/257) / [#256](https://github.com/Stringsaeed/money-management/pull/256) / [#255](https://github.com/Stringsaeed/money-management/pull/255) superseded by #258 |
| Next candidate | **BLOCKED (Mac ghosting)** | [#258](https://github.com/Stringsaeed/money-management/pull/258) tip [`709acf85250c02c8f9746c544da67f0c49f99233`](https://github.com/Stringsaeed/money-management/commit/709acf85250c02c8f9746c544da67f0c49f99233) — Expo Router Create Account screen; Jest+tsc green; EAS pending/hold merge; **Mac device retest blocked** (self-hosted agents ghosting). Do **not** merge #258 from this cert write. Do **not** claim Create Account PASS. |
| WorkOS webhook | **BLOCKED** | Owner must set prod `WORKOS_WEBHOOK_SECRET` + redeploy — `workos-webhook-blocked.md` (re-probe 05:47Z still **503**) |

Do not merge #258 from this cert write. Matrix remains incomplete / not certified.
