# #232 non-device API / seam matrix (Relates evidence)

Relates to #232 only. **Never** Closes/Fixes #232 or parent #224.
Matrix remains **incomplete / not certified**. No production deploy. No stim. No device used for this write.

## Scope

Advance certification for rows that can be proven **without** the iPhone (Mac agent busy with personal-upload retest). This document consolidates:

- Cloudflare Worker Observability re-query (2026-09-12 ~02:35Z)
- Prior cert artifacts already on PR [#241](https://github.com/Stringsaeed/money-management/pull/241)
- Merged fix PRs #242–#250

Out of scope here: personal upload UI, PowerSync removal bound, disposable reset, live device Household UX, Android.

## Live API

| Check | Result | Evidence |
| --- | --- | --- |
| `GET https://auth.trove.ing/` | **PASS** | HTTP **200** body `OK` (re-probe `2026-09-12T19:23:27Z`) |
| Worker | `money-management-server-prod-mfhkibosfd6z5ym5` | CF Observability service filter |

## Claims (non-device)

| Claim | Status | Primary evidence | CF re-query (this write) |
| --- | --- | --- | --- |
| JWT `claim_iss` path (AuthKit issuer accept) | **PASS** | #246 Deploy [34659057570](https://github.com/Stringsaeed/money-management/actions/runs/34659057570) on `5899747`; prior FAIL `post-245-claim-iss.txt` | Pre-#246 window: **22** `access_token_verify_failed code=claim_iss` + **22** `Unauthorized (claim_iss)`. Post-00:00Z Sep 12: **0** `claim_iss` lines. |
| `POST /rpc/households/listMine` | **PASS** | `post-250-listmine-pass.txt` / `post-250-sync-retest.md` — HTTP **200** `{"json":[]}` after #250 | Window 01:00–01:10Z: **7** `--> … listMine 200` lines; **no 500** in that window (`cf-api-corroboration-2026-09-12.txt`) |
| `POST /rpc/migration/getManifest` | **PASS** | `post-schema-sync-retest.md` / `post-schema-getmanifest-pass.txt` after DDL 0011–0015 | Window 01:20–01:45Z: `--> … getManifest 200 216ms` + `200 412ms` |
| Client id equality | **PASS** | `client-id-compare.txt` — `WORKOS_CLIENT_ID` == `EXPO_PUBLIC_WORKOS_CLIENT_ID` (**EQUAL**; values omitted) | n/a (local name compare; no secrets) |
| Isolation / API seams (automated) | **PARTIAL** | `test-api-workos-seams.txt` **97/97**; `test-deletion-projection.txt` **18/18**; `test-powersync-proper.txt` **9/9**; `test-ledger-scope.txt` **5/5**; `pipeline.test.ts` **18/18** viewer deny (`test-pipeline-viewer-deny.txt`) | Not a live cross-tenant stream proof |
| Live auth-gate (missing / forged JWT) | **PASS** | `live-auth-gate-probe-2026-09-12.txt` — **401** `missing_token` / `invalid_token` | CF 05:20–05:35Z: **7** missing + **8** invalid |
| Schema DDL 0011–0015 | **PASS** (reconfirm) | PlanetScale read-only column presence (`planetscale-schema-ddl-confirm-2026-09-12.txt` + `…-12b.txt` 05:47Z) | n/a |
| Live API/stream isolation (dual-identity) | **BLOCKED** | Requires two live session bearers | Absent: `CERT_USER_A_TOKEN`, `CERT_USER_B_TOKEN`, `WORKOS_API_KEY`, … (`api-isolation-live-2026-09-12.md`) |
| Queued writes after role downgrade | not in suite | Matrix row 5 | unchanged |
| PowerSync removal bound | **BLOCKED** | Absent mint env names: `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID` (`powersync-disposable-reset-blocked.md`) | unchanged |
| Disposable clean setup (row 8) | **BLOCKED** | #231 skipped reset + PlanetScale/PowerSync mint envs absent (`powersync-disposable-reset-blocked.md`) | unchanged |
| iOS OTP / callback AX | **BLOCKED** (automation) | See `ios-otp-ax-blocker.md` — **not** a PASS | No device this write |
| Android runtime | **BLOCKED** / not started | `android-runtime-blocked.md` | No device this write |
| WorkOS webhook / membership projection | **PROGRESS** (secret live; apply not PASS) | #266 + Deploy [34715924235](https://github.com/Stringsaeed/money-management/actions/runs/34715924235) **SUCCESS**; `POST /webhooks/workos` → **400** missing sig / **401** bad sig (`post-266-deploy-webhook-progress-2026-09-12T2006Z.md`) | Re-probe `2026-09-12T20:06:41Z`; signed delivery SKIPPED (agent secret MISSING) |
| CI (tsc + Jest on tip) | **PASS** (product gates) | `ci-stamp-2026-09-12.txt` — Typescript + Jest + EAS SUCCESS on `ded1e97`; GitGuardian FAILURE noted | n/a |
| Create Account next candidate | **BLOCKED** | #258 tip `709acf8` — Mac ghosting; **not** PASS (`create-account-hittest-status.md`) | n/a |

## Row roll-up (non-device lens)

| Matrix row | Non-device verdict | Notes |
| --- | --- | --- |
| 1 CI | **PARTIAL** | Tip `ded1e97` GH Actions Typescript + Jest + EAS **SUCCESS** (`ci-stamp-2026-09-12.txt`); lint/format FAIL pre-existing; GitGuardian FAILURE noted. |
| 2 AuthKit | **PARTIAL** | JWT/`listMine`/`getManifest` live **PASS**; cancel **PASS** (prior); OTP/callback **BLOCKED** (`ios-otp-ax-blocker.md`); Android **BLOCKED** (`android-runtime-blocked.md`). |
| 3 Personal sync | **PARTIAL** | getManifest + personal upload **PASS**; Create Account round-trip **BLOCKED** (#258 Mac ghosting — not PASS); two-device still open. |
| 4 Households | **PARTIAL** + webhook **PROGRESS** | API seams only; live create/switch/invite not evidenced; prod webhook secret live → **400/401** (re-probe `2026-09-12T20:06:41Z`); membership apply still needs signed delivery. |
| 5 Isolation | **PARTIAL** | Auth-gate forged/missing JWT **PASS**; viewer pipeline **PASS**; live dual-identity **BLOCKED**. |
| 6 Events + PowerSync removal | **PARTIAL** + **BLOCKED** | Event seams PASS; removal/offline **BLOCKED** (`powersync-disposable-reset-blocked.md`). |
| 7 Sign-out / deletion | **PARTIAL** | Deletion API seams PASS; live sign-out/identity switch not evidenced. |
| 8 Clean setup | **BLOCKED** | Reset skipped + mint envs (`powersync-disposable-reset-blocked.md`). |

## Env for this agent

| Name / capability | State |
| --- | --- |
| Cloudflare Observability MCP | **ready** — used for counts above |
| Local `CLOUDFLARE_API_TOKEN` | **absent** (not required; MCP sufficed) |
| PowerSync / PlanetScale mint names | **absent** — rows 6/8 stay **BLOCKED** (out of scope) |

No secret values recorded. No raw CDP/HAR.

## Owner decisions still needed

1. Accept iOS OTP AX automation **BLOCKER** (see `ios-otp-ax-blocker.md`) vs require alternate OTP path before row-2 completion.
2. Keep PowerSync removal / disposable reset **BLOCKED** until mint envs + reset policy (already documented).
3. Retry WorkOS deliveries / signed membership apply (secret already live post-#266 Deploy); optional agent-env secret for signed probe (do not invent).
4. Device slices remain: confirmed upload, Household UX, two-device, Android, sign-out.

## Governance

- Relates to #232 only.
- Parent #224 stays open.
- Do **not** merge PR #241 as certified.
- Do **not** rotate secrets from this write.
