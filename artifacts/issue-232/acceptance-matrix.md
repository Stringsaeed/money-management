# Issue #232 — WorkOS migration acceptance matrix

Certification matrix for [GitHub #232](https://github.com/Stringsaeed/money-management/issues/232) (*WorkOS: certify the complete migration on iOS and Android*). Evidence is from worktree `/Users/saeed/Work/money-management-wt-232` only. No secret values are recorded.

## Publication / governance

| Rule | State |
| --- | --- |
| Parent [#224](https://github.com/Stringsaeed/money-management/issues/224) | **Stays open** for owner review. Do not close or rewrite the spec. |
| This issue #232 | **Open.** Certification is **not complete**. Do not count blocked required cases as passing. |
| Merge | **Do not merge.** Issue implementation is not authorization to merge. |
| Production deploy | **Do not deploy** to production. |
| Development reset | [#231](https://github.com/Stringsaeed/money-management/issues/231) / [PR #240](https://github.com/Stringsaeed/money-management/pull/240) **skipped** the disposable-environment reset. Row 8 is blocked on that skip plus missing local env names. |

Report implementation, automated verification, runtime verification, and publication **separately**. This document is the verification record; it does not authorize publication.

## Revision

| Field | Value |
| --- | --- |
| Repo | `Stringsaeed/money-management` |
| Branch | `cursor/workos-certify-migration-b3d1` |
| HEAD | rebased onto `origin/main` @ `44fde92` (#242) — see tip commit after docs update |
| Provenance | Squash merge of #240 / closes #231 on `main`, plus [#242](https://github.com/Stringsaeed/money-management/pull/242) (`44fde92`) merged on `main` — AuthKit tokens missing `aud` no longer 401 when `client_id` matches. Certification branch rebased onto that `main`. |
| Worktree | `/Users/saeed/Work/money-management-wt-232` (plus cloud agent worktree for this rebase) |
| Live API | `https://auth.trove.ing` — health **200 OK**; Deploy Worker succeeded for `44fde92` (#242) — live API already serves the missing-`aud` / `client_id` verify fix |
| Test mailbox | Gmail MCP `stringsaeed@gmail.com` (WorkOS staging codes observed). Available for live email-code runs; **not** proof that those runs passed. |

Recorded in `revision.txt` (updated after rebase onto #242).

## Verdict (this write)

**Incomplete / not certifiable yet.**

- `#242` is **merged on `main`** and included on this branch via rebase; live `https://auth.trove.ing` already runs `44fde92` (Deploy Worker succeeded). API missing-`aud` AuthKit 401s are fixed in code and on the hosted worker. That is **not** live AuthKit device certification for row 2.
- Automated typecheck and focused package tests on the prior certification HEAD **pass**.
- Repo-wide `pnpm lint` and `pnpm format:check` **fail** on pre-existing findings. Not treated as a #232 regression.
- Full `pnpm test:ci` **passed**: mobile Jest **742/742** + `@trove/db` cutover **3/3** (`test-ci.txt`).
- Required iOS/Android runtime cases are **not passed**. Stim doctor ran; `stim start` has started Metro. `stim ios` / agent-device / Android have **no pass artifacts**. Row 2 still needs live AuthKit evidence.
- Disposable clean-setup after reset is **blocked**.

Do not merge. No production deploy. Parent #224 stays open. Do not close #232.


## Immediate draft-PR snapshot (2026-09-11T19:50Z)

- Automated: `tsc` PASS; focused WorkOS seams PASS; `pnpm test:ci` PASS (742+3); lint/format FAIL pre-existing.
- Live iOS: BLOCKED on ExpoSQLite vendoring (`sqlite3.c`/`sqlite3.h` missing from `node_modules/expo-sqlite/ios` until manual copy + `pod install`); first `stim ios` = `STIM_BUILD_FAILED`.
- Live Android: not started (harness doctor only).
- Env BLOCKED names for reset/webhook/local PowerSync mint: `WORKOS_WEBHOOK_SECRET`, `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID`, `PLANETSCALE_HOST`, `PLANETSCALE_DATABASE`, `PLANETSCALE_USER`, `PLANETSCALE_PASSWORD` (or `DATABASE_URL`).
- Parent #224 stays open. Do not merge. No production deploy.

## Rebase onto main + #242 (2026-09-11T20:45Z)

- Rebased `cursor/workos-certify-migration-b3d1` onto `origin/main` @ `44fde92` (merge of [#242](https://github.com/Stringsaeed/money-management/pull/242)).
- Live API `https://auth.trove.ing` already has #242 (Deploy Worker succeeded for `44fde92`).
- Row 2 still needs live AuthKit device evidence; do not treat hosted deploy as certification.
- Mac AuthKit agent reported **names only**: `WORKOS_CLIENT_ID` ≠ `EXPO_PUBLIC_WORKOS_CLIENT_ID`. Until those two env names match, **post-login API retest remains BLOCKED** (even with #242 live). Leave room for Mac screenshots / a dedicated mismatch row when that agent lands artifacts.
- Parent #224 stays open. **Relates to #232** only — do not close #232. Do not merge as certified. No production deploy.

### Client-id mismatch (placeholder for Mac evidence)

| Sub-criterion | Status | Evidence |
| --- | --- | --- |
| Mobile public client id matches API `WORKOS_CLIENT_ID` | `BLOCKED` | Names only: `WORKOS_CLIENT_ID` ≠ `EXPO_PUBLIC_WORKOS_CLIENT_ID` (Mac AuthKit agent). Post-login protected API retest cannot pass until aligned. Screenshots / mismatch proof: *pending Mac push — reconcile on next fetch.* |

## Status legend

| Status | Meaning |
| --- | --- |
| `PASS` | Required evidence exists and the case succeeded. |
| `FAIL` | Required check ran and failed. Call out pre-existing vs regression. |
| `PARTIAL` | Some sub-criteria have evidence; others are missing, blocked, or not in the captured suite. |
| `BLOCKED` | Cannot run a required case. Missing env **names** listed; no values. |
| `SKIPPED` | Intentionally not run, or predecessor skipped the work. |
| `IN PROGRESS` | Harness started. **Do not treat as pass.** Parent fills the Runtime section when artifacts exist. |

A row is complete only when every required sub-criterion is `PASS` (or an explicitly accepted skip with evidence). `PARTIAL` / `BLOCKED` / `IN PROGRESS` / `SKIPPED` are **not** completion.

---

## Matrix

### 1. Type / lint / format / CI on the integrated revision

| Sub-criterion | Status | Evidence |
| --- | --- | --- |
| `tsc --noEmit` `apps/mobile` | `PASS` | Reported exit 0 on this HEAD. No dedicated `tsc-*.txt` deposited under `artifacts/issue-232/`. |
| `tsc --noEmit` `packages/api` | `PASS` | Same. |
| `tsc --noEmit` `packages/auth` | `PASS` | Same. |
| `tsc --noEmit` `packages/db` | `PASS` | Same. |
| `pnpm lint` / `pnpm lint:fix` | `FAIL` (pre-existing) | `lint.txt`, `lint-fix.txt`. **794** `error` lines (anti-slop / complexity). Not a #232 regression: product code unchanged on this branch. |
| `pnpm format:check` | `FAIL` (pre-existing) | `format-check.txt`. 8 files: `apps/mobile/components/ui/input.tsx`, five `artifacts/powersync-planetscale*` paths, `internal/228-wip-gap-checklist.md`. Not a #232 regression. |
| Full `pnpm test:ci` | `PASS` | `test-ci.txt`: Jest **742** passed; cutover lib **3** passed. |

**Row status: `PARTIAL`.** Typecheck + `test:ci` pass; lint/format fail pre-existing (not #232 regressions).

### 2. Email-code sign-in, cancel, callback validation, restart, refresh rotation, session expiry, transient network recovery — iOS and Android

| Sub-criterion | Status | Evidence |
| --- | --- | --- |
| Access-token verify (issuer / audience / expiry / bearer) | `PARTIAL` (automated only) | Prior `@trove/auth` vitest in `test-auth.txt`. [#242](https://github.com/Stringsaeed/money-management/pull/242) merged on `main` (`44fde92`) and **deployed** to `https://auth.trove.ing` (Deploy Worker succeeded) — hosted API no longer 401s AuthKit tokens that omit `aud` when `client_id` matches. Automated coverage alone still **does not** prove hosted AuthKit UI, PKCE return, or refresh rotation on device. |
| Email-code sign-in (live) | `IN PROGRESS` (iOS harness) / not started (Android) | Mailbox available. **Still needs live AuthKit evidence** (device screenshot, snapshot, or Maestro artifact). None present on this branch at rebase time. |
| Cancel abandoned sign-in | not evidenced | No runtime artifact. |
| Callback / state validation on return | not evidenced on device | Automated token tests only. `#242` unblocks bearer verify for missing-`aud` tokens; live callback still unproven. |
| Restart survives session | not evidenced | No runtime artifact. |
| Refresh rotation | not evidenced | No runtime artifact. |
| Session expiry | not evidenced on device | Automated expired-token coverage in `@trove/auth` only. |
| Transient network recovery | not evidenced | No runtime artifact. |
| iOS development build | `FAIL` then retry | First `stim ios` → `STIM_BUILD_FAILED` (`stim-ios.json`): ExpoSQLite missing vendored `sqlite3.c`/`sqlite3.h` under `node_modules/expo-sqlite/ios` (`exsqlite3_*` unresolved). Remediation: copy vendor sources + `pod install` (`pod-install.txt`); retry log `stim-ios-retry.json`. Follow-ups on this PR: ExpoSQLite postinstall + Metro `.rnrepo-cache` blockList. |
| Android development build | not started | No Android doctor / stim / agent-device artifacts. **Do not claim Android pass.** |

**Row status: `IN PROGRESS` (iOS harness) + not evidenced (required flows) + post-login API retest `BLOCKED` on client-id mismatch.** `#242` is on `main`, included here, and live on `auth.trove.ing`; **row 2 still needs live AuthKit evidence.** Mac agent: `WORKOS_CLIENT_ID` ≠ `EXPO_PUBLIC_WORKOS_CLIENT_ID` (names only) blocks post-login API retest until those env names match. Local WorkOS client env *names* are present for AuthKit UI, but the mismatch means bearer verify against the hosted API can still fail for the wrong client.

Env present (names only) that this row can use: `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_REDIRECT_URI`, `WORKOS_CLAIM_TOKEN`, `WORKOS_COOKIE_PASSWORD`, `EXPO_PUBLIC_WORKOS_CLIENT_ID`, `EXPO_PUBLIC_WORKOS_REDIRECT_URI`, `EXPO_PUBLIC_SERVER_URL`.

### 3. Anonymous use, confirmed first upload, populated cloud + separate device data, two-device personal sync without orgs

| Sub-criterion | Status | Evidence |
| --- | --- | --- |
| Personal ledger without a Household | `PARTIAL` (API seam) | `test-api-workos-seams.txt`: `personal-ledger.test.ts` **18** (creates/joins no Household; isolation; import on personal scope). `personal-budget-recurring.test.ts` **4**. `test-ledger-scope.txt` **5/5** (personal vs organization ledger ids). |
| Confirmed first upload / import manifest | `PARTIAL` (API + mobile hook) | `import-bundle.test.ts` **15**, `manifest.test.ts` **13**; mobile `use-enable-sync` / `lib/migration/manifest` in `test-mobile-sync.txt` **19/19**. Hook tests are not a live confirm-upload. |
| Anonymous local-only use | not evidenced | Requires device. No stim/agent-device proof. |
| Populated cloud opens separately; device ledger preserved; no auto-merge | not evidenced live | Same mobile/API seams are not two-store device proof. |
| Two-device personal core / budget / recurring sync, no orgs | not evidenced | No second-device run. `EXPO_PUBLIC_POWERSYNC_URL` absent locally; client may obtain the endpoint from the API token response when hitting `auth.trove.ing`. That does **not** certify two-device sync. |

**Row status: `PARTIAL` automated / live not run.**

### 4. Explicit Household create, multi-Household switch, invitations, management return, admin/member/viewer, personal-data privacy

| Sub-criterion | Status | Evidence |
| --- | --- | --- |
| Explicit Household create (no implicit org on sign-in) | `PARTIAL` (API seam) | `households/service.test.ts` **25** in `test-api-workos-seams.txt` (`createHousehold`, retries, list/get, invite, roles, last-admin, delete, widget handoff). Personal-ledger tests assert sign-in/write does not create a Household. |
| Multi-Household switch | not evidenced live | No device selector proof. |
| Invitations via WorkOS | `PARTIAL` (API seam) | `member administration > lets only admins invite, through WorkOS invitations`. No live invite acceptance. |
| Management-page return (widget) | `PARTIAL` (API + auth) | Widget handoff + expired/demoted-admin codes in households tests; `@trove/auth` member-widget-page **3**. No iOS/Android return artifact. |
| Admin / member / viewer | `PARTIAL` (API seam) | Import-bundle rejects member/viewer bulk-import; households role changes; PowerSync streams deny inactive/unknown roles (`test-powersync-proper.txt` **9/9**). Device role UX not run. |
| Personal data stays private on create/join | `PARTIAL` (API seam) | Personal vs Household isolation in personal-ledger + budget-recurring + PowerSync streams. No live create/join privacy proof. |
| Webhook-driven membership apply | `BLOCKED` locally | `WORKOS_WEBHOOK_SECRET` **absent** locally. Cannot verify webhook signatures on a local worker. GitHub Actions secrets include `WORKOS_*` but **not** `WORKOS_WEBHOOK_SECRET` (`gh secret list`). |

**Row status: `PARTIAL` automated / live not run / webhook verify `BLOCKED`.**

### 5. Cross-User/Household API/stream isolation, cross-scope financial-ref rejection, queued writes after role downgrade, stale-response handling

| Sub-criterion | Status | Evidence |
| --- | --- | --- |
| Cross-User personal isolation | `PARTIAL` (API + streams) | Personal-ledger isolation (invisible, not merely forbidden); personal budget/recurring cross-user reject; PowerSync personal stream scoped by owner (`test-powersync-proper.txt`). |
| Cross-Household / stream isolation | `PARTIAL` (API + streams) | Households `getHousehold` invisible to non-members; PowerSync “Personal Ledger and Household streams from bleeding”; household queries membership-guarded. |
| Cross-scope financial-reference rejection | `PARTIAL` (API seam) | Personal-ledger rejects addressing another User’s account / category / envelope; organization-scope rejects a non-member. Command `pipeline.test.ts` (viewer capability map) was **not** in the captured 97-test run. |
| Queued writes after role downgrade | not in captured suite | No focused test file in `test-api-workos-seams.txt` covers queued Commands after a live demotion. Widget handoff rejects codes after admin demotion — **not** the same criterion. |
| Stale-response handling | `PARTIAL` (events only) | Membership projection stale/older/delayed observations (`test-deletion-projection.txt` **18/18**, also inside the 97). Client stale HTTP/sync responses after sign-out or identity switch: **not** in the captured mobile 19. |
| Live API/stream isolation | not evidenced | No runtime artifact. |

**Row status: `PARTIAL`.** Isolation seams pass in captured automated suites. Downgrade-queued writes and client stale-response are **not** certified.

### 6. Duplicated / reordered / missed events + reconciliation; PowerSync removal / offline-device limitation

| Sub-criterion | Status | Evidence |
| --- | --- | --- |
| Duplicate membership events | `PASS` (API seam) | `projectMembership ordering rule > applies the same event twice without changing anything`. |
| Reordered / delayed / missed events + reconciliation | `PASS` (API seam) | Older-after-newer ignored; delayed newer wins; deletion tombstone vs stale created; bootstrap tombstones; `listMyHouseholds` drops a membership WorkOS no longer lists. |
| Unknown Household/User refuse | `PASS` (API seam) | Projection refuses unknown Households/Users; households ignore unknown Organizations. |
| PowerSync connection removal (measured bound) | `BLOCKED` | Not measured. Local worker mint blocked — absent: `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID`. GitHub Actions secrets **do** include `POWERSYNC_*` (names only; values not claimed). Stream **config** tests (`test-powersync-proper.txt` **9/9**) are not a live removal bound. |
| Offline-device limitation (cannot observe remote removal until reconnect) | `BLOCKED` / not measured | No offline-device run. Do not promise remote erasure while disconnected. |

**Row status: `PARTIAL` (event seams) + `BLOCKED` (live PowerSync removal / offline measure).**

Note: `test-powersync.txt` is a **failed** `vitest run` (`No test suite found` / `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`). The package script is `node --test sync-streams.test.ts`. The proper run is `test-powersync-proper.txt` **9/9**. The vitest miss is a runner mismatch, not a product regression.

### 7. Sync-or-discard sign-out, identity switching, User deletion preserving shared history, last-admin guard, recoverable Household deletion

| Sub-criterion | Status | Evidence |
| --- | --- | --- |
| User deletion anonymizes attribution, clears personal data, ignores delayed membership events | `PASS` (API seam) | `deletion/service.test.ts` in `test-api-workos-seams.txt` and `test-deletion-projection.txt`. |
| Last-admin / sole-admin User-deletion guard | `PASS` (API seam) | `requestUserDeletion > blocks sole admins until they appoint another admin or delete the Household`; households `keeps the last admin in place`. |
| Recoverable Household deletion | `PASS` (API seam) | Confirm-name + admin-only; shared ledger removed, personal kept, org tombstoned; resumes after WorkOS failure without duplicating local deletes. |
| Sync-or-discard sign-out | not evidenced live | Mobile `use-sync-worker` / `use-enable-sync` (**19/19**) cover connect/disconnect/import hooks, not the hosted sign-out choice on device. |
| Identity switching (cache / queue isolation) | not evidenced live | No device identity-switch artifact. |
| Sign-out / deletion on iOS and Android | not evidenced | Runtime section empty of pass paths. |

**Row status: `PARTIAL` automated / live not run.**

### 8. Clean development setup after removal/reset using live or disposable services

| Sub-criterion | Status | Evidence |
| --- | --- | --- |
| Better Auth / custom Household removal on `main` | predecessor done | HEAD is the #240 squash that closed #231. This ticket certifies composition; it did not re-implement removal. |
| Disposable env reset (DB, WorkOS env, PowerSync, device stores) | `SKIPPED` by #231/#240 | Reset was not performed. Cannot claim a clean start after reset. |
| Local disposable DB / worker mint | `BLOCKED` | Absent locally: `PLANETSCALE_HOST`, `PLANETSCALE_DATABASE`, `PLANETSCALE_USER`, `PLANETSCALE_PASSWORD` (or `DATABASE_URL`); `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID`. |
| Webhook verify on local worker | `BLOCKED` | `WORKOS_WEBHOOK_SECRET` absent locally **and** absent from GitHub Actions secrets. |
| Live API reachable | `PASS` (health only) | `https://auth.trove.ing` health **200 OK**. Not a clean-install walkthrough. |
| Clean-install anonymous + login + personal sync + Household select after reset | not evidenced | Requires the skipped reset plus device runs. |

CI secrets (`gh secret list`) include `POWERSYNC_*`, `PLANETSCALE_*`, and `WORKOS_*`, and do **not** include `WORKOS_WEBHOOK_SECRET`. Values are not claimed.

**Row status: `BLOCKED`.**

---

## Automated seam → row map

| Captured suite | Result | Rows it partially satisfies |
| --- | --- | --- |
| `tsc --noEmit` mobile / api / auth / db | exit 0 | 1 |
| `pnpm lint` / `lint:fix` | FAIL, 794 errors, pre-existing | 1 (not a #232 regression) |
| `pnpm format:check` | FAIL, 8 pre-existing files | 1 (not a #232 regression) |
| `@trove/auth` `vitest run` | **14/14** `test-auth.txt` | 2 (token/callback contract), 4 (widget page) |
| `@trove/api` focused vitest (8 files) | **97/97** `test-api-workos-seams.txt` | 3, 4, 5, 6, 7 |
| `@trove/api` deletion + projection | **18/18** `test-deletion-projection.txt` | 6, 7 |
| `@trove/powersync` `pnpm test` (`node --test`) | **9/9** `test-powersync-proper.txt` | 3, 4, 5 |
| `@trove/powersync` via vitest | FAIL runner mismatch `test-powersync.txt` | ignore for product status |
| Ledger-scope `node --test` | **5/5** `test-ledger-scope.txt` | 3, 5 |
| Mobile jest `use-enable-sync`, `use-sync-worker`, manifest, initialize | **19/19** `test-mobile-sync.txt` | 3, 7 (hooks only) |
| `pnpm test:ci` | not run | 1 pending |

API focused files in the 97: `powersync/token.test.ts` (4), `personal-budget-recurring.test.ts` (4), `deletion/service.test.ts` (5), `membership/projection.test.ts` (13), `migration/manifest.test.ts` (13), `import-bundle.test.ts` (15), `personal-ledger.test.ts` (18), `households/service.test.ts` (25).

---

## Runtime (stim / agent-device)

Parent fills this section when `stim ios` / `stim android` / agent-device produce artifact paths. **Do not treat any row as device-pass without those paths.**

| Step | Status | Artifact |
| --- | --- | --- |
| `stim doctor ios` | Ran (stim 1.0.0-rc.21). Notes only — not a product pass. | `stim-doctor-ios.txt` |
| Doctor notes | Main checkout 1 commit behind `origin/main`; cannot read `buildCacheProvider` from `app.config.ts` without executing it. | same |
| `stim start` | `IN PROGRESS` — Metro starting | `stim-start.json` (port **8083**, supervisor pid **68661**, logsDir `/Users/saeed/.stim/workspaces/mobile--f32c8e64f19c5328/logs`) |
| `stim ios` | `IN PROGRESS` / no proof dir | `ios-run.env` only. Expected proof root `artifacts/issue-232/ios-232-20260911-233735` **not present**. |
| agent-device (iOS) | not evidenced | — |
| `stim doctor android` / `stim android` / agent-device (Android) | not started | — |
| Maestro / verify-trove flows | not started | — |

iOS/Android email-code, cancel, restart, refresh, expiry, network recovery, anonymous use, two-device sync, Household switch, invitations, widget return, sign-out, and identity switch remain **uncertified**.

---

## Env presence (names only)

### Present locally (`.env.local` / `apps/mobile/.env`)

- `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_REDIRECT_URI`, `WORKOS_CLAIM_TOKEN`, `WORKOS_COOKIE_PASSWORD`
- `EXPO_PUBLIC_WORKOS_CLIENT_ID`, `EXPO_PUBLIC_WORKOS_REDIRECT_URI`
- `EXPO_PUBLIC_SERVER_URL` (`https://auth.trove.ing`)

### Absent locally (block the named capability)

| Absent name(s) | Blocks |
| --- | --- |
| `WORKOS_WEBHOOK_SECRET` | Local webhook signature verify. Also **absent** from GitHub Actions secrets. |
| `POWERSYNC_URL`, `POWERSYNC_JWT_PRIVATE_KEY`, `POWERSYNC_JWT_KID` | Local worker mint; live PowerSync removal-bound measure from this machine. |
| `PLANETSCALE_HOST`, `PLANETSCALE_DATABASE`, `PLANETSCALE_USER`, `PLANETSCALE_PASSWORD` (or `DATABASE_URL`) | Local disposable DB reset / mint. |
| `EXPO_PUBLIC_POWERSYNC_URL` | Not required if the client takes the endpoint from the API token response against `auth.trove.ing`. Still not two-device proof. |

### Present but mismatched (names only; Mac AuthKit agent)

| Names | Blocks |
| --- | --- |
| `WORKOS_CLIENT_ID` ≠ `EXPO_PUBLIC_WORKOS_CLIENT_ID` | Post-login protected API retest / AuthKit bearer acceptance against live `auth.trove.ing`, even with #242 deployed. Align the two names before treating row 2 API follow-up as runnable. |

GitHub Actions secrets include `POWERSYNC_*`, `PLANETSCALE_*`, and `WORKOS_*`, and do **not** include `WORKOS_WEBHOOK_SECRET`. Do not claim values.

---

## Commands used

```bash
# Typecheck (reported exit 0; no tsc log files in this directory)
npx tsc --noEmit   # apps/mobile, packages/api, packages/auth, packages/db

# Lint / format (failed; pre-existing)
pnpm lint          # -> lint.txt (oxlint, 794 error lines)
pnpm lint:fix      # -> lint-fix.txt
pnpm format:check  # -> format-check.txt (8 files)

# Focused automated suites
pnpm --filter @trove/auth test
# vitest run in packages/auth -> test-auth.txt (14/14)

# packages/api focused (97/97) -> test-api-workos-seams.txt
# token, personal-budget-recurring, deletion, projection, manifest,
# import-bundle, personal-ledger, households

# deletion + projection repeat (18/18) -> test-deletion-projection.txt

# PowerSync: vitest is the wrong runner -> test-powersync.txt FAIL
pnpm --filter @trove/powersync test
# node --test sync-streams.test.ts -> test-powersync-proper.txt (9/9)

# ledger-scope node --test -> test-ledger-scope.txt (5/5)

# apps/mobile focused jest -> test-mobile-sync.txt (19/19)
# hooks/use-enable-sync.test.tsx
# hooks/use-sync-worker.test.tsx
# lib/migration/manifest.test.ts
# db/initialize.test.ts

# NOT run
# pnpm test:ci

# Runtime harness (not a product pass)
stim doctor ios    # -> stim-doctor-ios.txt
stim start --json  # -> stim-start.json (port 8083)
```

---

## Artifact index (`artifacts/issue-232/`)

| File | What it is |
| --- | --- |
| `acceptance-matrix.md` | This matrix. |
| `revision.txt` | `revision=ebcbe35…` / branch / `date=2026-09-11T19:34:39Z`. |
| `lint.txt` | `oxlint` FAIL, 794 error lines. |
| `lint-fix.txt` | `oxlint --fix` same class of pre-existing failures. |
| `format-check.txt` | `oxfmt --check` FAIL, 8 pre-existing files. |
| `test-auth.txt` | `@trove/auth` 14/14. |
| `test-api-workos-seams.txt` | `@trove/api` focused 97/97. |
| `test-deletion-projection.txt` | deletion + projection 18/18. |
| `test-powersync.txt` | Wrong runner (vitest) FAIL. |
| `test-powersync-proper.txt` | `node --test` 9/9. |
| `test-ledger-scope.txt` | ledger-scope 5/5. |
| `test-mobile-sync.txt` | mobile jest 19/19. |
| `stim-doctor-ios.txt` | stim 1.0.0-rc.21 doctor notes. |
| `stim-start.json` | Metro starting on 8083. |
| `ios-run.env` | `VERIFY_TROVE_RUN_ID=232-20260911-233735`. |

Absent at this write (parent may add): `tsc-*.txt`, `test-ci.txt`, `ios-232-20260911-233735/`, Android artifacts, agent-device snapshots/screenshots, PowerSync removal-bound logs.

---

## What would close #232

1. Finish iOS and Android runtime rows 2–4 and 7 with artifact paths (or record a concrete blocker).
2. Run `pnpm test:ci` and attach the log; keep lint/format classified as pre-existing unless a new regression appears.
3. Measure PowerSync existing-connection removal and the offline-device limitation, or keep those sub-criteria `BLOCKED` with the env names above.
4. Either perform the skipped disposable reset and reproduce clean setup (row 8), or keep row 8 `BLOCKED` and **do not** claim #232 complete.
5. Keep #224 open. Do not merge. Do not deploy to production.
