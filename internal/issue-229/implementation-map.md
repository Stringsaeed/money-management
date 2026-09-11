# #229 Implementation Map

Checkout: `/Users/saeed/Work/money-management-wt-229` @ `c512b8d` (`feat(households): WorkOS Organizations own Membership (#228)`).

Parent: #224. Blockers #226/#227/#228 are merged. Spec: [GitHub #229](https://github.com/Stringsaeed/money-management/issues/229).

Do **not** invent new ledger adapters. Reuse `LedgerScope` / `SyncedLedgerBinding` / `CommandScope` / `scopeColumns` / `personalLedgerBinding` / `householdLedgerBinding`.

---

## 1. Existing Enable Sync / personal sync / import / upload paths

### Mobile — Household Enable Sync (#98, still live)

| Symbol                                                                             | Path                                                    | Role                                                                                                                 |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `EnableSyncCard`                                                                   | `apps/mobile/components/household/enable-sync-card.tsx` | UI: create/join Household + upload                                                                                   |
| `useEnableSync` / `enableSync`                                                     | `apps/mobile/hooks/use-enable-sync.ts`                  | Orchestrates create household → backup → `runImport` → PowerSync first sync → `markMigrationCompleted` → `setSynced` |
| `runImport`                                                                        | `apps/mobile/lib/migration/enable-sync.ts`              | Sends dependency-ordered `import_bundle` chunks; stops on reject; compares manifests                                 |
| `buildImportChunks` / `remapCategoryId`                                            | `apps/mobile/lib/migration/chunks.ts`                   | Reads local Drizzle A/C/T + budget + recurring; namespaces category ids as `` `${householdId}::${localId}` ``        |
| `computeLocalManifest` / `computeLocalManifestFromChunks`                          | `apps/mobile/lib/migration/manifest.ts`                 | Client integrity half                                                                                                |
| `backupLocalDatabase`                                                              | `apps/mobile/lib/migration/backup.ts`                   | Pre-import WAL checkpoint + SQLite copy                                                                              |
| `markMigrationCompleted` / `getMigratedHouseholdId` / `COMPLETED_HOUSEHOLD_ID_KEY` | `apps/mobile/lib/migration/status.ts`                   | Device enrollment for Household sync                                                                                 |
| Copy                                                                               | `apps/mobile/components/household/enable-sync-copy.ts`  | Idle / matched / mismatch strings                                                                                    |

Flow today: `orpc.households.create` (optional) → `backupLocalDatabase` → `orpc.commands.apply({ kind: "import_bundle", householdId, ... })` → `connectPowerSync` + `syncStream("household_ledger").waitForFirstSync()` → `orpc.migration.getManifest` → match → enroll.

### Mobile — Personal sync (#226, empty cloud only)

| Symbol                                                                            | Path                                                      | Role                                                                                                    |
| --------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `PersonalSyncCard`                                                                | `apps/mobile/components/household/personal-sync-card.tsx` | CTA "Sync just for me"; copy says starts empty                                                          |
| `useEnablePersonalSync` / `enablePersonalSync`                                    | `apps/mobile/hooks/use-enable-sync.ts`                    | `connectPowerSync` → `waitForFirstSync` → `markPersonalSyncEnabled` → `setSynced`. **Uploads nothing.** |
| `markPersonalSyncEnabled` / `getPersonalSyncUserId` / `PERSONAL_SYNC_USER_ID_KEY` | `apps/mobile/lib/migration/status.ts`                     | Per-device, per-User opt-in                                                                             |
| `getSyncEnrollment` / `useSyncEnrollment`                                         | status + hook                                             | Both Household + personal flags                                                                         |
| Host                                                                              | `SignedInHousehold` → `PersonalAndCreateCards`            | Shows personal card only when no active Household panel path                                            |

### API — import

| Symbol                           | Path                                                      | Role                                                                                                      |
| -------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `importBundleHandler`            | `packages/api/src/lib/commands/handlers/import-bundle.ts` | Plans inserts with `onConflictDoNothing`; typed as `HouseholdPlanContext`; **no `supportsPersonalScope`** |
| `COMMAND_HANDLERS.import_bundle` | `packages/api/src/lib/commands/handlers.ts`               | Registered; personal pipeline rejects via `personalUnsupportedRejection`                                  |
| Capability                       | `packages/api/src/lib/commands/capabilities.ts`           | `import_bundle: ["admin"]` (personal actors already get `actorRole: "admin"`)                             |
| `migrationRouter.getManifest`    | `packages/api/src/routers/migration.ts`                   | `requireHouseholdMember` + `computeImportManifest(db, householdId)`                                       |
| `computeImportManifest`          | `packages/api/src/lib/migration/manifest.ts`              | Filters by `householdId` columns                                                                          |
| Wire contract                    | `packages/protocol/src/import.ts`                         | `IMPORT_ENTITY_TYPES`, `ImportBundlePayload`, `ImportManifest`, `manifestsMatch`                          |

Proven rejection: `packages/api/src/lib/commands/personal-ledger.test.ts` — personal `import_bundle` → `invalid_intent` on `scope`.

### Selection after opt-in

| Symbol                                                 | Path                                                                 | Role                                                                                                               |
| ------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `selectLedgerSource`                                   | `apps/mobile/modules/ledger-data-source/provider.tsx`                | Migrated Household wins over personal; personal only if `personalSyncUserId === authenticatedUserId`; else `local` |
| `selectLedgerSourceForAccess` / `ledgerFactsForAccess` | `apps/mobile/modules/access/access.ts`                               | Access → enrollment → mode bridge                                                                                  |
| `LedgerDataSourceGate`                                 | `apps/mobile/modules/ledger-data-source/ledger-data-source-gate.tsx` | Wraps synced tree in `SyncedTransactionsProvider`                                                                  |

---

## 2. Sign-out / session clear / cache isolation today

### Sign-out path (no pending-edit gate)

| Symbol                  | Path                                                         | Behavior                                                                                      |
| ----------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| UI                      | `SignedInHousehold` / settings `onSignOut={access.signOut}`  | Immediate press → sign out                                                                    |
| `signOut`               | `apps/mobile/modules/access/provider.tsx` `useAccessActions` | `setSignedOut(true)` → `tryRemoteSignOut()` → `clearLedgerSelection(userId)` → `clearClaim()` |
| `tryRemoteSignOut`      | `apps/mobile/modules/access/session-probe.ts`                | Best-effort `authClient.signOut()`                                                            |
| `signOut` / SecureStore | `apps/mobile/lib/auth-client.ts`                             | Clears memory session + `SESSION_KEY` + `PKCE_KEY`                                            |
| `clearClaim`            | `apps/mobile/modules/access/claim-store.ts`                  | Clears identity claim SecureStore keys                                                        |
| `clearLedgerSelection`  | `apps/mobile/modules/access/ledger-selection-store.ts`       | Per-user selection key only                                                                   |

**Not cleared on sign-out today:** PowerSync DB (`disconnectAndClearPowerSync`), upload queue / pending commands, `PERSONAL_SYNC_USER_ID_KEY` / Household migration keys, React Query households/migration caches, sync-mode store.

### Identity / cache isolation baseline (#226 "ticket 2")

| Symbol                                     | Path                                                  | Behavior                                                                           |
| ------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `openPowerSyncDatabase(userId)`            | `apps/mobile/modules/powersync/database.ts`           | If `active.userId !== userId`, `disconnectAndClear` + reopen single `powersync.db` |
| `personalLedgerId` / `resolveCommandScope` | `packages/protocol/src/ledger-scope.ts`, `command.ts` | Personal wire scope has no user id; server binds to JWT `sub`                      |
| `authorizeEnvelope`                        | `packages/api/src/lib/commands/pipeline.ts`           | Personal → `actorRole: "admin"`; org → `findActiveMembership`                      |
| `selectLedgerSource` personal gate         | provider                                              | Wrong user's `personalSyncUserId` stays `local`                                    |
| Claim rewrite                              | `nextClaim` / `sameIdentity`                          | New identity rewrites held claim                                                   |
| Households query key                       | `householdsQueryKeyForUser(userId)`                   | User-scoped list key                                                               |

Local Drizzle A/C/T (`authority-local` role) is intentionally **not** identity-scoped — that is the independent device ledger #229 must preserve.

---

## 3. PowerSync disconnect / pending commands / checkpoints

| Symbol                                                                     | Path                                               | Role                                                                                                                      |
| -------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `connectPowerSync` / `disconnectPowerSync` / `disconnectAndClearPowerSync` | `apps/mobile/modules/powersync/database.ts`        | Connect vs leave DB vs wipe synced cache                                                                                  |
| `reconcilePowerSyncStatus`                                                 | `apps/mobile/modules/powersync/status.ts`          | Ineligible (`!householdId \|\| !userId`): `disconnect` if `preserveWhenIneligible`, else `disconnectAndClear`             |
| `useSyncWorker`                                                            | `apps/mobile/hooks/use-sync-worker.ts`             | `getUploadQueueStats()` → `pendingCount`; `syncNow`; kill-switch poll; 10m degrade                                        |
| `PowerSyncWorker`                                                          | `apps/mobile/components/sync/powersync-worker.tsx` | Eligible **only** when `migration.data === activeHouseholdId`. Personal enrollment does **not** keep the worker connected |
| `personalStreamLoader` / `householdStreamLoader`                           | `apps/mobile/modules/ledger-db/collections.ts`     | Personal: `database.waitForFirstSync()`; Household: named stream subscribe                                                |
| Streams                                                                    | `packages/powersync/sync-streams.yaml`             | `personal_ledger` auto-subscribe; `household_*` on demand + membership predicates                                         |
| Checkpoint meaning                                                         | CONTEXT.md Sync Stream / Watermark                 | App does not store custom watermarks; readiness = first stream checkpoint                                                 |
| Backup checkpoint                                                          | `backupLocalDatabase`                              | SQLite `PRAGMA wal_checkpoint(TRUNCATE)` before copy — different from PowerSync checkpoint                                |

**Implication for #229:** personal import must (1) verify server import completion, (2) wait for `personal_ledger` first sync, (3) only then `markPersonalSyncEnabled` / select synced — same recoverability pattern as Household `runImport` + `connectAndWait`. Ongoing personal connectivity should also expand `PowerSyncWorker` eligibility beyond Household migration (otherwise worker disconnects after enable when `preserveWhenIneligible`).

Pending edits surface: `pendingCount` from upload queue. Rejected edits: `discardRejectedChange` in `modules/powersync/rejected-changes.ts` (inbox, not sign-out).

---

## 4. Membership removal / access projection hooks (#228)

### Server projection

| Symbol                                              | Path                                                            | Role                                         |
| --------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------- |
| `projectMembership`                                 | `packages/api/src/lib/membership/projection.ts`                 | Observed-at ordering; inactive tombstones    |
| `tombstoneUnlistedUserMemberships` / household twin | same                                                            | Bootstrap list reconcile                     |
| `findActiveMembership`                              | `packages/api/src/lib/membership/access.ts`                     | Sole Household auth read                     |
| Reconcile ages                                      | `docs/architecture/membership-revocation.md`                    | 60s list, 5m token, 30m token TTL worst case |
| Stream SQL                                          | `packages/powersync/sync-streams.yaml` + `sync-streams.test.ts` | Deny inactive / unknown roles                |

### Mobile discard-and-clear (Household only)

| Symbol                         | Path                                                            | Role                                                                                                                                                                                                   |
| ------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MembershipRevocationCleanup`  | `apps/mobile/components/sync/membership-revocation-cleanup.tsx` | Diff previous vs current `listMine` memberships; if enrolled Household lost → `clearHouseholdSyncEnrollment` + `disconnectAndClearPowerSync`; if selection Household lost → `setActiveHousehold(null)` |
| `clearHouseholdSyncEnrollment` | `apps/mobile/lib/migration/status.ts`                           | Deletes Household migration keys only; **leaves personal opt-in**                                                                                                                                      |
| Mount                          | `apps/mobile/components/sync/sync-worker.tsx`                   | Renders cleanup beside `PowerSyncWorker`                                                                                                                                                               |

**Already matches #229 intent for removal:** no unauthorized upload offer; confirmed removal clears Household cache/pending via PowerSync wipe. Offline vs confirmed: cleanup only runs when signed-in memberships reload (unreachable keeps prior memberships / `household.unavailable` offline path in `access.ts`). Extend tests for "no import CTA on removal" and pending discard without sync-first.

---

## 5. Ledger scope contracts to reuse (#226 / #227) — do not invent adapters

| Contract            | Path                                                                                      | Symbols                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Scope encoding      | `packages/protocol/src/ledger-scope.ts`                                                   | `LedgerScope`, `personalLedgerId`, `organizationLedgerId`, `ledgerIdForScope`, `parseLedgerId`, `isPersonalLedgerId` |
| Wire command scope  | `packages/protocol/src/command.ts`                                                        | `CommandScope`, `resolveCommandScope`, `commandLedgerId`, `CommandEnvelope.scope`                                    |
| Import order        | `packages/protocol/src/import.ts`                                                         | `IMPORT_ENTITY_TYPES` (accounts → … → occurrences)                                                                   |
| Prefactor doc       | `docs/architecture/ledger-scope-prefactor.md`                                             | Layer table; #229 owns personal onboarding import                                                                    |
| ADR                 | `docs/adr/0026-…`, `0027-…`                                                               | Personal empty-by-default; Membership projection                                                                     |
| API binding         | `packages/api/src/lib/commands/scope.ts`                                                  | `bindLedgerScope`, `ensurePersonalLedger`, `ensureUserProjection`, `ScopeBinding`                                    |
| Pipeline            | `packages/api/src/lib/commands/pipeline.ts`                                               | `PlanContext`, `HouseholdPlanContext`, `supportsPersonalScope`, `authorizeEnvelope`, `provisionPersonalLedger`       |
| Dual-write columns  | `packages/api/src/lib/commands/handlers/shared.ts`                                        | `scopeColumns(ctx)` → `{ ledgerId, householdId }`                                                                    |
| Mobile binding      | `apps/mobile/modules/ledger-data-source/provider.tsx`                                     | `SyncedLedgerBinding`, `personalLedgerBinding`, `householdLedgerBinding`                                             |
| Synced coordinators | `modules/ledger-db/*`, `modules/budgeting/synced.ts`, `modules/recurring-rules/synced.ts` | Already bind on `selection.kind === "synced"` + binding.scope                                                        |
| Auth contract       | `docs/auth/workos-authkit-contract.md`                                                    | Sign-in uploads nothing; personal entitlement = session                                                              |

**Reuse pattern for personal import:** send `scope: { type: "personal" }` (no `householdId`); stamp rows with `scopeColumns` so `householdId` is `null`; filter manifests by `ledgerId` (`personal:<userId>`), not Household.

---

## 6. Gaps vs #229 acceptance — build vs wire

| Acceptance                                                                                                 | Status                 | Build vs wire                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One-time confirm upload to **empty** personal cloud; sign-in alone does not upload                         | **Partial**            | Wire: keep sign-in / empty `useEnablePersonalSync` non-uploading. **Build:** confirmation UI + emptiness probe + personal import path (do not auto-run Household Enable Sync).                                                                                                                                                                                                        |
| Dependency-ordered A/C/T + budgeting + recurring; retry/partial safe                                       | **Partial**            | Wire: reuse `IMPORT_ENTITY_TYPES`, `buildImportChunks`, handler `onConflictDoNothing`, manifest match. **Build:** personal scope on handler (`supportsPersonalScope: true` or ledger-scoped PlanContext); category remap key = personal ledger id (not Household); `runImport`/`getManifest` ledger-scoped; conflict guards that currently assert `householdId` must tolerate `null`. |
| Verify import + PowerSync readiness before selecting synced; recoverability until checkpoint               | **Partial**            | Wire: Household `runImport` + `connectAndWait` pattern; personal empty already waits first sync before enroll. **Build:** personal import must enroll only after matched manifest + `waitForFirstSync`; leave local enrollment unset / backup intact on pause.                                                                                                                        |
| Populated personal cloud → open cloud, preserve independent device ledger; no merge tool                   | **Missing**            | **Build:** detect non-empty personal ledger (API count/manifest or post-first-sync row presence). Branch: empty → confirm upload; populated → `markPersonalSyncEnabled` without `runImport`, keep Drizzle local tables untouched (already true when not uploaded). UI copy for coexistence.                                                                                           |
| Voluntary sign-out: sync-first or explicit discard when pending                                            | **Missing**            | **Build:** gate `access.signOut` (or wrapper) on `getUploadQueueStats` / worker `pendingCount`; sheet: Sync then sign out / Discard and sign out / Cancel; on sync failure re-offer retry/discard.                                                                                                                                                                                    |
| Completed sign-out clears signed-in personal + Household caches + credentials; local-only intact           | **Partial**            | Wire: `clearClaim`, auth SecureStore clear, `clearLedgerSelection`. **Build:** call `disconnectAndClearPowerSync`; invalidate/remove signed-in query keys; decide enrollment flags (clear personal/Household sync keys so next identity cannot reuse selection, without deleting authority-local SQLite).                                                                             |
| Identity change cannot replay other user's commands / checkpoints / stale PS+query                         | **Partial**            | Wire: PS user switch clears DB; command personal binding; selection gate. **Build:** ensure sign-out/identity switch always clears PS before new session uses `powersync.db`; no silent discard of other identity's pending without the #229 choice when same device still signed in.                                                                                                 |
| Confirmed Membership removal: discard-and-clear, no unauthorized upload; offline stays offline             | **Mostly done (#228)** | Wire: `MembershipRevocationCleanup`. **Build:** polish pending discard semantics; ensure removal UI never offers Enable Sync/import into lost Household; tests for offline vs confirmed.                                                                                                                                                                                              |
| Interrupted import, coexistence, pending edits, offline sign-out, identity switch, cold restart acceptance | **Missing evidence**   | API/sync tests + iOS/Android QA.                                                                                                                                                                                                                                                                                                                                                      |

### Suggested implementation slices (order)

1. **API personal import:** `importBundleHandler.supportsPersonalScope = true`; plan against `PlanContext` using `scopeColumns`; conflict/content loads already key `ledgerId`; migrate `getManifest` to accept personal scope / `ledgerId` (membership check only for org).
2. **Mobile personal import core:** generalize `runImport` / chunks remap / manifests from `householdId: string` to ledger binding (`scope` + `ledgerId`); deterministic category remap `` `${ledgerId}::${localId}` ``.
3. **Empty vs populated branch** in `useEnablePersonalSync` (or new `useEnablePersonalImport`): probe → confirm upload OR open-without-upload.
4. **Checkpoint gate** before `markPersonalSyncEnabled`.
5. **PowerSyncWorker** eligibility for personal enrollment (keep connection / pendingCount accurate).
6. **Sign-out lifecycle** UI + clear caches.
7. **Membership removal** regression + any pending-discard tightening.
8. **Tests + device acceptance.**

Out of scope (parent #224): merge tool, User deletion, Household deletion, Better Auth removal leftovers.

---

## 7. Suggested test files to extend

### API / protocol

- `packages/api/src/lib/commands/import-bundle.test.ts` — add personal-scope apply, idempotent retry, conflict across ledgers, empty vs populated behavior
- `packages/api/src/lib/commands/personal-ledger.test.ts` — **flip** current "rejects import_bundle" once personal import is allowed; keep other Household-only rejections
- `packages/api/src/lib/commands/personal-budget-recurring.test.ts` — imported budget/recurring rows settle under personal ledger
- New or extend migration router tests beside `packages/api/src/routers/migration.ts` — personal `getManifest` auth (session owner only; stranger forbidden)
- `packages/protocol/src/ledger-scope.test.ts` — only if remap/helpers land in protocol (prefer keep remap in mobile migration)

### Mobile migration / sync

- `apps/mobile/lib/migration/enable-sync.test.ts` — personal `runImport` envelopes use `scope: { type: "personal" }`; pause leaves enrollment unset
- `apps/mobile/lib/migration/chunks.test.ts` — personal category remap; full entity order including budget/recurring
- `apps/mobile/lib/migration/manifest.test.ts` / `status` tests — enrollment flags; clear-on-sign-out helpers if added
- `apps/mobile/hooks/use-enable-sync.test.tsx` — empty upload confirm; populated coexistence (no `runImport`); checkpoint ordering
- `apps/mobile/hooks/use-sync-worker.test.tsx` — personal eligibility; pendingCount; disconnect vs clear
- `apps/mobile/modules/ledger-data-source/provider.test.ts` — coexistence selection (local vs personal synced)
- `apps/mobile/modules/access/access.test.ts` — sign-out facts / offline vs revoked

### Membership / sign-out

- New: `apps/mobile/components/sync/membership-revocation-cleanup.test.tsx` (if absent) — confirmed removal clears PS; no import; personal selection untouched
- New: sign-out pending sheet tests colocated with the new component/hook
- `packages/api/src/lib/membership/projection.test.ts` — already covers tombstones; keep as regression

### PowerSync / live

- `packages/powersync/sync-streams.test.ts` — regression only
- `packages/powersync/live-verify.mjs` — extend for personal import then first sync if used in CI evidence

### Device acceptance (manual / stim)

Interrupted import, populated-cloud coexistence, pending sign-out sync/discard, offline sign-out, identity switch, cold restart — per issue instructions; distinguish from Jest.

---

## Doc anchors

- `docs/architecture/ledger-scope-prefactor.md` — "#229: onboarding/import… A personal sync still starts empty."
- `docs/adr/0026` — turning on personal sync creates no Household and uploads nothing; #229 owns import
- `docs/adr/0027` — selection local; Membership projection; creation never from sign-in/personal sync
- `docs/architecture/membership-revocation.md` — discard-and-clear on confirmed removal
- `docs/architecture/sqlite-roles.md` — `migration-backup` role for chunks/status/enable-sync/cleanup
- `CONTEXT.md` — Authentication Session independent of local ledger; Sync Stream / Watermark; note: Membership glossary line still says "at most one active" (stale vs #228 multi-Household) — fix only if editing glossary in-scope

---

## Explicit non-goals for implementers

- Do not route personal onboarding through Household `EnableSyncCard` / `households.create`.
- Do not add a reviewed merge tool for populated cloud + device.
- Do not invent a second ledger data-source adapter; extend existing bindings and `import_bundle`.
- Do not erase authority-local SQLite on sign-out.
- Do not claim webhook-immediate global PowerSync revocation beyond `membership-revocation.md` bounds.
