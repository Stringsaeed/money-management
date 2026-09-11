# #228 WIP gap checklist

Worktree: `/Users/saeed/Work/money-management-wt-228`  
Branch: `cursor/workos-households-members-b3d1`  
Issue: https://github.com/Stringsaeed/money-management/issues/228  
Date: 2026-09-11  

Server/auth/db/protocol/PowerSync YAML are largely implemented. Mobile is mid-rewrite and currently uncompilable. Client/server contract is still split. Do not implement here.

---

## DONE

### AC1 — explicit Household create (server)
- `createHousehold` in `/Users/saeed/Work/money-management-wt-228/packages/api/src/lib/households/service.ts` creates one WorkOS org (`idempotencyKey = userId:requestId`), organization `ledger` + `household` rows, admin membership; retries reuse `create_request_id`.
- Router requires `requestId` UUID: `/Users/saeed/Work/money-management-wt-228/packages/api/src/routers/households.ts`.
- Sign-in (`ensureUserProjection`) and personal write (`ensurePersonalLedger` in `/Users/saeed/Work/money-management-wt-228/packages/api/src/lib/commands/scope.ts`) do not create Households.
- Personal sync hook comments/path do not create orgs: `/Users/saeed/Work/money-management-wt-228/apps/mobile/hooks/use-enable-sync.ts` (`useEnablePersonalSync`).
- Tests cover idempotency + partial-failure retry: `/Users/saeed/Work/money-management-wt-228/packages/api/src/lib/households/service.test.ts`.

### AC2 — selector (partial, client WIP)
- Local selection store separate from membership: `/Users/saeed/Work/money-management-wt-228/apps/mobile/modules/access/ledger-selection-store.ts`.
- `pickActiveHousehold` / `normalizeLedgerSelection` validate active membership: `/Users/saeed/Work/money-management-wt-228/apps/mobile/modules/access/access.ts`.
- `setActiveHousehold` is client-local (no `households.setActive` RPC); rejects unknown ids: `/Users/saeed/Work/money-management-wt-228/apps/mobile/modules/access/provider.tsx`.
- Native Personal + HH list UI: `/Users/saeed/Work/money-management-wt-228/apps/mobile/components/household/signed-in-household.tsx`.

### AC3 — ledger isolation (server)
- Create writes a separate organization ledger; `deleteHousehold` test asserts personal rows survive.
- Streams keep `personal_ledger` vs `household_*` disjoint: `/Users/saeed/Work/money-management-wt-228/packages/powersync/sync-streams.yaml`.
- Command pipeline personal vs org auth: `/Users/saeed/Work/money-management-wt-228/packages/api/src/lib/commands/pipeline.ts`.

### AC4 — widget page (server)
- Handoff issue/consume (hash, 120s, single-use): `/Users/saeed/Work/money-management-wt-228/packages/api/src/lib/households/widget-handoff.ts`.
- Admin-only `decideWidgetToken` + re-check on exchange: `/Users/saeed/Work/money-management-wt-228/packages/auth/src/widget-contract.ts`, `exchangeWidgetHandoff`.
- Page: fragment `#code=`, erase history, POST `/widgets/session`, no token in URL, `trove://widget-return`: `/Users/saeed/Work/money-management-wt-228/packages/auth/src/member-widget-page.ts`.
- Mounted: `/Users/saeed/Work/money-management-wt-228/apps/server/src/member-widget.ts`, `/Users/saeed/Work/money-management-wt-228/apps/server/src/index.ts`.
- Mobile opens it: `/Users/saeed/Work/money-management-wt-228/apps/mobile/hooks/use-households.ts` (`useOpenMemberWidget`).

### AC5 — invitations / roles (server + UI path)
- WorkOS `sendInvitation`; invite-code table dropped in `/Users/saeed/Work/money-management-wt-228/packages/db/src/migrations/0013_workos_households.sql`.
- `member.role.change` retired: `/Users/saeed/Work/money-management-wt-228/packages/protocol/src/command.ts`; handler deleted.
- Roles `admin|member|viewer`; capability map: `/Users/saeed/Work/money-management-wt-228/packages/api/src/lib/commands/capabilities.ts`.
- Mobile: no invite-code form, no owner transfer; widget is Manage: `/Users/saeed/Work/money-management-wt-228/apps/mobile/components/household/join-household-form.tsx`, `household-members.tsx`, `active-household-panel.tsx`.
- AuthKit authorize uses `provider=authkit` (email codes): `/Users/saeed/Work/money-management-wt-228/apps/mobile/lib/auth-client.ts`.

### AC6 — projection + reconcile
- Ordering / tombstones / unknown household-or-user: `/Users/saeed/Work/money-management-wt-228/packages/api/src/lib/membership/projection.ts`.
- Deny unknown/inactive: `/Users/saeed/Work/money-management-wt-228/packages/api/src/lib/membership/access.ts`.
- Bootstrap + `applyHouseholdEvent`: `/Users/saeed/Work/money-management-wt-228/packages/api/src/lib/membership/reconcile.ts`.
- Verified webhooks: `/Users/saeed/Work/money-management-wt-228/packages/auth/src/household-events.ts`, `/Users/saeed/Work/money-management-wt-228/apps/server/src/workos-webhooks.ts`.
- Tests: `projection.test.ts`, `household-events.test.ts`, `service.test.ts` (duplicate/reorder/missed/bootstrap).

### AC7 — API + stream access + bound doc
- Commands use live projection (`findActiveMembership`).
- Household streams require `status='active'` and known roles: `sync-streams.yaml`.
- Token path reconciles before mint (5m): `/Users/saeed/Work/money-management-wt-228/packages/api/src/routers/powersync.ts`.
- Bound documented: `/Users/saeed/Work/money-management-wt-228/docs/architecture/membership-revocation.md` (API ~60s; new token ~5m; existing connection up to 30m TTL).
- ADR 0027 present: `/Users/saeed/Work/money-management-wt-228/docs/adr/0027-workos-owns-household-membership.md`.

### AC8 — stale events (server only)
- Inactive tombstone wins over stale created: `projection.ts` + tests.

### AC9 — safeguards
- Widget findings: `/Users/saeed/Work/money-management-wt-228/packages/auth/src/widget-contract.ts` (`WIDGET_SAFEGUARD_FINDINGS`).
- Last-admin on Trove mutations: `/Users/saeed/Work/money-management-wt-228/packages/api/src/lib/households/admin-guard.ts`.
- User-deletion guard exists, unwired: `/Users/saeed/Work/money-management-wt-228/packages/api/src/lib/households/sole-admin-deletion-guard.ts`.
- Widget-side adminless is observational (`getHousehold.adminless`); webhooks do not invent last-admin.
- Docs: `/Users/saeed/Work/money-management-wt-228/docs/architecture/workos-widget-contract.md`.

### AC10 — lean tests / no #229–232 product
- Focused service/projection/event/widget-page tests exist.
- No User-deletion API, no Better Auth removal, no certification suite.
- `deleteHousehold` is implemented early (#230 overlap) — see MUST FIX.

### Infra / schema
- Migration conflict with `0012_budget_recurring_ledger_scope.sql` avoided: landed as `0013_workos_households.sql` + journal entry.
- Mirror trigger dropped; create writes ledger directly (ADR 0026 leftover owned by #228).
- `WORKOS_WEBHOOK_SECRET` added in `/Users/saeed/Work/money-management-wt-228/packages/infra/alchemy.run.ts`.
- Auth exports: `/Users/saeed/Work/money-management-wt-228/packages/auth/src/index.ts`.

---

## MISSING / BROKEN (with file paths)

### Compile / tests red
- `/Users/saeed/Work/money-management-wt-228/apps/mobile/hooks/use-households.ts` imports `createId` from `@/utils/id`; only `generateId` exists (`/Users/saeed/Work/money-management-wt-228/apps/mobile/utils/id.ts`). Create Household will not typecheck.
- `/Users/saeed/Work/money-management-wt-228/apps/mobile/modules/access/access.test.ts` still uses `role: "owner"`, `isActive`, old `pickActiveHousehold([rows])` and `AccessCore` without `selection`. Will fail tsc + Jest.
- `/Users/saeed/Work/money-management-wt-228/apps/mobile/jest/setup-env.ts` still mocks `setActive`, `generateInvite`, `acceptInvite`, `transferOwnership`.
- Dead invite-code module still tested: `/Users/saeed/Work/money-management-wt-228/apps/mobile/utils/invite-code.ts`, `invite-code.test.ts`.

### AC1 leaks
- `/Users/saeed/Work/money-management-wt-228/apps/mobile/hooks/use-enable-sync.ts` still auto-`households.create({ name })` **without `requestId`** when `householdId` is missing. Enable Sync is not “personal sync,” but it still creates Households and will 400 against the new router.
- `/Users/saeed/Work/money-management-wt-228/apps/mobile/components/household/enable-sync-card.tsx` still offers a name field + create path when `activeHouseholdId` is null.
- `/Users/saeed/Work/money-management-wt-228/apps/mobile/components/household/create-household-form.tsx` copy still says creator becomes **owner**.

### AC2 incomplete
- `/Users/saeed/Work/money-management-wt-228/apps/mobile/components/sync/powersync-worker.tsx` only connects when a **migrated Household** is selected. Selecting Personal (or losing HH) calls `useSyncWorker(null, undefined, preserve)` → `disconnect()` (`/Users/saeed/Work/money-management-wt-228/apps/mobile/modules/powersync/status.ts`). That tears down the singleton PowerSync client, including `personal_ledger`.
- No dedicated selector component/directory; inline buttons only. Acceptable if behavior is complete — it is not, because of the worker.

### AC3 incomplete
- After create, UI still shows Enable Sync into the new HH (`signed-in-household.tsx` + `active-household-panel.tsx` + `use-enable-sync.ts` `import_bundle`). That uploads **device-local** rows into the shared ledger — contradicts “create/join leaves personal data private; starts a separate shared ledger.”
- Household streams still hide `visibility='private'` accounts from other members (`sync-streams.yaml` household_ledger). AC says all HH Accounts are shared. Full private-visibility removal is #231, but this AC line is unmet.
- `CONTEXT.md` still defines Owner, Invite Code, and “at most one active Membership.”

### AC4 incomplete
- No mobile handler/route for `trove://widget-return` (no app file; `links.ts` only parses magic/reset). Return is a bare scheme href. Not proven; may land on Expo Router with no screen.
- Widget URL is `EXPO_PUBLIC_SERVER_URL + /widgets/members#code=` (`use-households.ts`, `apps/mobile/utils/widget-handoff.ts`). Must be the API origin that serves `member-widget.ts`, not a marketing host.
- `workos-widget-contract.md` still describes the old “validates against authenticated session” identity model; actual handoff is code-exchange, not a session cookie.

### AC5 leftovers
- Trove still exposes `households.invite` / `setMemberRole` RPCs (`households.ts`). Mobile no longer calls them; widget is the UI. Parallel role-change API is leftover “authority” on the wire.
- Better Auth magic-link parsers remain (`apps/mobile/modules/access/links.ts`) — #231, but still an active code path if old links arrive.

### AC7 / AC8 client revocation
- Confirmed removal does **not** clear HH pending edits/cache. Worker uses `disconnect` not `disconnectAndClear` when signed-in (`powersync-worker.tsx` `preserveWhenIneligible`).
- No client code stops HH uploads or drops HH queue/cache on tombstone (`connector.ts` still uploads until disconnect/forbidden).
- `membership-revocation.md` claims “confirmed removal then stops uploads and clears … cache” — **not implemented on device**.
- Existing PowerSync connections are **not** force-revoked; bound is token TTL. Doc is honest; runtime unproven.

### AC9
- `assertUserDeletionAllowed` is not imported by any router. Correct for not doing #230, but the guard is unused. `listSoleAdminHouseholds` scans **all** active memberships (not scoped to the user) — fine as a stub, not production-ready.

### AC10 / scope
- `deleteHousehold` (service + mobile Danger Zone) is #230 work (org + shared ledger delete). Incomplete vs #230 (no recoverable multi-boundary deletion, no User deletion). Shipping it here over-scopes.
- Untracked new files not staged: `packages/api/src/lib/households/*`, `membership/*`, `apps/server/src/member-widget.ts`, `workos-webhooks.ts`, auth household/widget files, ADR 0027, revocation doc, mobile selection/handoff.

### Docs / snapshot
- No drizzle snapshot for 0013 (only `meta/0000_snapshot.json`).
- ADR 0026 still says “until #228” for dual `household_id` — dual-write remains (intentionally later).

---

## MUST FIX BEFORE PR (ordered)

1. **Unbreak create:** `createId` → `generateId` in `apps/mobile/hooks/use-households.ts`.
2. **Rewrite** `apps/mobile/modules/access/access.test.ts` (+ jest orpc mocks) to `LedgerSelection` + `admin|member|viewer`. Red suite will fail CI.
3. **Stop Enable Sync from creating Households** and from importing device-local data into a new/joined HH by default (`use-enable-sync.ts`, `enable-sync-card.tsx`). Create/join must leave a **empty shared ledger**; personal/device data stays put (AC1 + AC3). `households.create` must always send `requestId`.
4. **Keep PowerSync up for Personal** when the selector is Personal; only drop household stream subscription. Today `powersync-worker.tsx` disconnects the singleton and kills `personal_ledger`.
5. **Confirmed removal path:** on membership loss, stop HH uploads, clear HH pending commands/cache, keep offline local-only + personal. Wire something real; `membership-revocation.md` currently overclaims.
6. **Widget return:** handle `trove://widget-return` (route or Linking) so Manage actually returns to Settings/household, not a dead link.
7. **Either hide or clearly mark `deleteHousehold` as #230** — do not treat this PR as User/Household deletion complete; keep sole-admin User-deletion guard **unwired** to a delete-user API.
8. **CONTEXT.md** Membership/Owner/Invite Code glossary — at least stop contradicting ADR 0027 (full Better Auth scrub is #231).
9. Stage the untracked household/auth/server/doc files; PR is incomplete without them.
10. Drop or quarantine dead `invite-code` tests so they are not the active path.

---

## ACCEPTANCE GAPS LIKELY UNVERIFIABLE IN THIS PR (device/runtime)

- Multi-user WorkOS invitation → AuthKit email code → join → listMine bootstrap.
- Widget open / fragment handoff / token mint / iOS+Android `trove://widget-return`.
- Role downgrade + removal against **existing** PowerSync connections; measure actual stream drop vs 30m token bound.
- Missed/delayed/reordered live webhooks + reconcile recovery.
- Cross-Household isolation on a real PowerSync instance (`live-verify.mjs` still seeds private HH accounts).
- Offline device retains HH use; reconnect after removal clears cache (no client implementation).
- Widget sole-admin self-demotion (documented limitation; cannot prevent).
- Sign-in never creating an org in a live AuthKit environment (session may carry `organization_id` from invitation accept — must not create a second Trove Household).

---

## ENV VARS NEEDED (names only)

- `WORKOS_API_KEY`
- `WORKOS_CLIENT_ID`
- `WORKOS_TOKEN_AUDIENCE`
- `WORKOS_TOKEN_ISSUER`
- `WORKOS_WEBHOOK_SECRET`
- `EXPO_PUBLIC_WORKOS_CLIENT_ID`
- `EXPO_PUBLIC_WORKOS_REDIRECT_URI`
- `EXPO_PUBLIC_SERVER_URL`
- `CORS_ORIGIN`
- `POWERSYNC_URL`
- `POWERSYNC_JWT_PRIVATE_KEY`
- `POWERSYNC_JWT_KID`
