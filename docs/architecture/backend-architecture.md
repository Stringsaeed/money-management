# Backend Architecture

- **Status:** Proposed — no code written yet
- **Recorded:** 2026-08-20
- **Decision history:** this document
- **Domain language:** [Money Management Context](../../CONTEXT.md)
- **Related:** all 22 files in [`docs/adr/`](../adr/), [Recurring Rules Architecture](./recurring-rules-design.md), [Ledger Cache Coherence Plan](./ledger-cache-coherence-plan.md)

## Purpose

Turn Trove from a single-device, local-only app into a multi-user, shared-budget product: households and partners sharing one budget, with the server as the authoritative source of truth for every derived financial value (Available Money, Funding Pool, Card Payment Reserve, Rollover, Budget/Envelope Health). The client keeps local SQLite, but its role changes from _the_ truth to an offline cache and outbox — the app must stay fully usable offline for reads and queued writes, syncing and reconciling once connected.

The backend must be **scalable and agnostic**: the compute layer must not be locked to a single vendor's serverless product, and must scale horizontally without a per-request compute ceiling.

## Scope

This document specifies:

- the household/multi-user data model and its resolution of ownership questions the ADRs leave implicit (single-owner budgeting facts, versus multiple household members);
- the Postgres schema strategy for both the already-shipped domain (accounts, categories, transactions, recurring rules) and the not-yet-shipped envelope/budget domain, built directly from the 22 ADRs;
- the sync protocol between client and server (offline outbox, command idempotency, conflict resolution);
- the compute and hosting architecture (Supabase for managed state, a standalone service for business logic);
- the Turborepo monorepo restructuring this repository needs to host `apps/api` and its supporting packages alongside the existing Expo app;
- a phased delivery sequence and the migration path for existing local-only installs.

Out of scope for this document (see [Explicit non-goals](#explicit-non-goals)): bank aggregation, CRDTs/operational-transform collaborative editing, end-to-end encryption, a web client, cross-household transfers, server-side currency conversion.

**A note on sequencing relative to the codebase this document describes:** envelope budgeting — the domain this whole architecture exists to serve — is not merged to `main` as of this writing. It is mid-flight across several `codex/envelopes-*` worktrees. What is built and well-tested on `main` today is accounts, categories, transactions, and a notably mature recurring-rules engine (`modules/recurring-rules/`, ~1,860 lines, 492-line test suite) that already implements revision-based optimistic concurrency and idempotent settlement — its decision log states it was designed "local-first now but for future multiple writers." This document specifies the full backend, including the envelope/budget domain, directly from the ADRs — in parallel with, but structurally decoupled from, the in-flight client work. Two concrete shape conflicts are already known between that work and this specification (see [Porting strategy](#porting-strategy)) and should be raised with that stream independent of when backend implementation begins.

## Canonical model

### Household

The tenancy root. Every fact table carries `household_id`. New tables: `households`, `household_members` (composite `(household_id, user_id)`, `role`, `status` — archived, not deleted, on removal, since a removed member's authorship attribution must survive), `household_invites` (`token_hash`, `expires_at`, `accepted_by`), `household_settings` (home currency, budget activation state — the household-scoped half of today's client `app_settings`; device/user preferences and migration bookkeeping stay client-local forever).

### Role

Four roles — `owner`, `admin`, `member`, `viewer` — resolved through one capability map, `can(role, commandKind)`, enforced both in the command authorizer and mirrored as RLS policies. `viewer` exists from the start for the accountant/advisor read-only case; adding it later means retrofitting every policy, so it is included even though nothing in the initial delivery requires it.

_Avoid_: a boolean permission matrix scattered across endpoints instead of one owned capability map.

### Household-scoped budgeting fact

Envelopes, Category Mappings, Assignments, Funding Memberships, Rollover Settings, and Budget Workspaces are **household singletons — there is no per-member variant.** This is a resolution, not an assumption: the ADRs define Funding Pool as the sum of Funding Accounts sharing one currency (ADR-0002) and require availability to stay explainable from durable facts (ADR-0013, ADR-0017). A private envelope drawing from a shared pool would move the other member's Unassigned Money for reasons they can't see; a private pool would fracture the single-pool-per-currency model. Neither is worth the fracture.

_Avoid_: Per-Member Envelope, Personal Budget Workspace.

### Private Account

An Account with `visibility='private'` and an `owner_user_id`. Visible only to its owner (an RLS predicate applied transitively to its transactions). **Cannot hold Funding Membership** — this is the privacy mechanism, and it invents no new budget invariant: a private account's spending is exactly the ADR's existing **Outside-Budget Spending** concept, applied at the account-selection level rather than a new concept.

_Avoid_: Personal Envelope, Hidden Budget.

### Command

The unit of a client write. A domain intent (`assignment.commit`, `transaction.create`) — not a row diff — carrying a client-generated `command_id` that doubles as its idempotency key, mirroring the shape of the existing `RecurringChange` type. Applied optimistically to the local cache on creation, queued in the client's outbox, and processed exactly once server-side regardless of retry count.

_Avoid_: Mutation Payload, CRUD Request.

### Household Change

One row appended to `household_changes` per committed command (or per entity it touched), carrying a per-household sequence number, the acting user, and an `effects[]` tag vocabulary (extending the client's existing `ledger-cache.ts` matrix: `rules|upcoming|ledger|balances|summaries` plus new `envelopes|assignments|projections|members`). Simultaneously the sync feed, the Realtime invalidation signal, and the household's activity history.

_Avoid_: Audit Log Entry (implies compliance-only; this is load-bearing for sync).

## Invariants

Every point below is a hard constraint on the Postgres schema and the standalone service's transactional business logic, carried forward from the 22 ADRs (cited inline) plus two invariants specific to the multi-user extension itself.

1. Store only durable facts; derive everything else on read or via a provably-reconstructible cache — never a second mutable financial authority (ADR-0017).
2. Cross-ledger/budget writes (refunds, card payments, resource archival) commit as one atomic transaction — no eventually-consistent window between ledger and budget state (ADR-0019).
3. Assignments, Category Mappings, Funding Memberships, and Rollover Settings are append-only / period-effective-dated rows — never destructively updated (ADR-0006, 0007, 0012, 0016).
4. A historical Transaction edit forward-recalculates every later Budget Period as a visible Historical Adjustment — no locked periods, no current-month-only posting (ADR-0005).
5. Archive, never delete, any resource with financial history; hard delete only when history is empty. Budget Reset is a distinct, narrower, separately confirmed operation (ADR-0009, 0022).
6. Envelopes and Funding Pools are single-currency; no implicit conversion; unsupported cross-currency transfers are flagged and excluded, never silently converted (ADR-0002).
7. Category→Envelope attribution is via period-aware mapping, not a per-transaction field; one Envelope per Category at a time (ADR-0003).
8. Budget Period membership derives strictly from the stored Ledger Date, independent of client timezone — the server, not any client's clock, is the tie-breaker once shared across a household's devices (ADR-0021).
9. Period-Opening Funding Pools are reconstructed, never snapshotted, when Funding Membership changes mid-period or budgeting activates (ADR-0013).
10. The Assignment-consumption waterfall (cash overspending → oldest Unfunded Card Spending, FIFO → new availability) and the Card Payment waterfall (reserve → funded Opening Card Debt → Unassigned Money vs. unfunded debt → Card Credit) are implemented exactly, as tested transactional logic — never per-endpoint ad hoc math (ADR-0004, 0010, 0011, 0014).
11. Future Assignments draw only from currently owned Unassigned Money, and are blocked while their currency workspace has any cash Envelope Overspending or Unfunded Card Spending (ADR-0015).
12. Refunds are linked, cumulative-capped, own-period-attributed, reserve-adjusting, and block unsafe edits/deletes of the transaction they link to (ADR-0008).
13. Recurring Rule Occurrence identity `(rule_id, scheduled_date)` is a unique constraint; Rule Revision is the optimistic-concurrency version column; Eligibility Floor is the only progress cursor; settlement applies a rule's pre-change state before a same-day pause/archive/edit takes effect.
14. Every command runs in one server transaction: idempotency check → authorization → precondition/version check → apply → recompute → append to `household_changes` — partial application is never observable.
15. **(Multi-user extension)** No fact table's household-scoping is implicit. Every composite key includes `household_id`, and every foreign key is itself composite `(household_id, other_id)` — a cross-household reference is structurally impossible, not merely policy-blocked.
16. **(Multi-user extension)** A rejected command never partially applies and never silently merges with another member's concurrent change — it either commits whole or is returned to the client as a typed rejection for the user to re-edit or discard.

## Architecture

### Managed state: Supabase

- **Postgres** — the durable store. Plain Postgres underneath, so it can be pointed at any Postgres provider (Neon, RDS, self-hosted) later without a rewrite.
- **Row-Level Security** — a database-level backstop for household tenancy, enforced in addition to, not instead of, application-layer authorization. A leaked cross-household query is the worst possible bug in a finance app; RLS is the guarantee that survives an application bug.
- **Auth** — email/OTP/social sign-in; a custom access-token hook (a Postgres function, not an Edge Function) stamps household/role claims into the issued JWT. The compute service verifies these JWTs itself against Supabase's JWKS endpoint — no Supabase SDK dependency server-side, so the auth provider boundary is swappable later without touching request-handling code.
- **Realtime** — Postgres logical replication to a per-household channel, pushing only `{seq, effects[]}`, never row data. This is the network-aware replacement for the client's in-process `ledger-cache.ts` coherence layer.

### Compute: a standalone containerized service (`apps/api`)

Business logic — the assignment and card-payment waterfalls, period projections, the settlement engine — does **not** run in Supabase Edge Functions. Verified against current Supabase documentation, Edge Functions cap CPU time at 2 seconds per request (separate from and much tighter than the 150–400s wall-clock limit) — too tight a ceiling to design a scalable system around, particularly for an ADR-0005 historical-adjustment cascade touching many periods.

Instead, `apps/api` is a normal, long-running Node service (recommended framework: **Hono** — minimal, fast, and itself portable across runtimes) deployed as a container to any host — Fly.io, Railway, AWS ECS/Fargate, Cloud Run, or self-hosted — with zero code changes required to move between them. It holds a normal connection pool to Postgres (no per-invocation cold start, no forced transaction-pooler workaround), and scales horizontally by adding stateless replicas behind a load balancer.

Business logic lives in a shared TypeScript package, `packages/domain`, imported by `apps/api` through standard pnpm-workspace resolution and **also imported client-side** for optimistic local preview — one implementation, not two that can drift. The cross-runtime constraint this creates is **Hermes compatibility** (React Native's JS engine), not Deno compatibility: `packages/domain` must avoid Node-only built-ins and anything Hermes doesn't support, a bar the existing client code (plain TypeScript, `date-fns`) already clears.

### Schema strategy

Universal conventions on every fact table: `household_id`; composite primary/foreign keys `(household_id, id)`; a `version` integer generalizing `recurring_rules.revision`; `created_by`/`updated_by` for attribution; client-generated UUIDs (already how `utils/id.ts` works, so offline-originated IDs need no server allocation).

The six existing SQLite tables (`accounts`, `categories`, `transactions`, `recurring_rules`, `recurring_occurrences`, `exchange_rates`) map over with household scoping added; `recurring_occurrences`' composite PK `(rule_id, scheduled_date)` becomes the multi-writer double-settlement guard as-is. The envelope/budget domain is modeled in groups: workspace, envelope, **period-effective** (`category_mappings`, `funding_memberships`, `rollover_settings`), append-only **assignments** (a correction is a reversing row plus replacement, never an edit), refund linkage, and a `historical_adjustments` audit table.

For the period-effective group, this specification makes one deliberate choice against the in-flight client branch's schema: **do not store `effective_to_period`.** The branch stores it, with a `CHECK` constraint that only application discipline enforces as insert-only. This specification instead derives it — `LEAD(effective_from_period) OVER (...)` — and represents "ended" as a tombstone row with a null target, making the table genuinely `INSERT`-only (`REVOKE UPDATE, DELETE` plus a trigger backstop). This removes an entire class of drift between a stored end and the next row's start.

Derived values (Available Money, Funding Pool, Rollover, Card Payment Reserve) stay non-authoritative per Invariant 1, but a `period_projection_cache` table (household, currency, period, JSON payload, stamped with the household's change sequence number) avoids recomputing a household's entire period stack on every read. It is a cache, not an authority: derived exclusively from facts, truncable with zero data loss, never written directly by a command.

## Sync protocol

The client gains two local, never-synced tables: `outbox_commands` (queued commands, keyed by their idempotency-doubling `command_id`) and `sync_state` (per-household watermark). A write is applied optimistically to the local cache immediately on creation, queued in the outbox in the same local transaction, and drained to `POST /commands` in order.

`apps/api` processes each command in one transaction on its own held connection:

1. **Idempotency** — `INSERT ... ON CONFLICT DO NOTHING` on `command_id`; a retry after a timeout replays the stored result rather than re-executing.
2. **Authorization** — `can(role, commandKind)` against live membership.
3. **Lock** — a transaction-scoped advisory lock (`pg_advisory_xact_lock`, auto-released on commit or rollback) per `(household, currency)` for budget-mutating commands, serializing the waterfall-critical section without locking the whole household. Transaction-scoped is chosen here for its automatic-release safety; it is not a workaround for a connection-pooler constraint, since `apps/api` is a long-lived process holding its own connections.
4. **Precondition check** — generalizes the client's existing Rule-Revision pattern: `expectedVersion` for mutable entities, `expectedAsOf` predicates for append-only ones (e.g. "Unassigned Money ≥ X," re-validated at commit time so a queued-while-offline assignment that's no longer fundable is rejected, not silently overdrawn).
5. **Apply and recompute** via `packages/domain`.
6. **Append** to `household_changes`.
7. **Return** a discriminated result — `applied | stale_version | invalid_intent | preview_required | missing_entity | forbidden | conflict` — mirroring the client's existing `RecurringChangeResult` shape, plus the recomputed rows/projections so the client can write back without a second round trip.

The client pulls the actual delta via `GET /sync?since=<seq>`; Realtime's `{seq, effects[]}` push is purely a latency optimization telling the client when to pull — never a correctness dependency, and switchable to polling per household with identical results.

**Conflict policy is server-authoritative rebase-or-discard.** No CRDTs, no automatic merge. A rejected command is never silently dropped or silently merged — it surfaces in a client-side "Rejected Changes" inbox for the user to re-edit or discard.

## Monorepo structure & migration

The repository is a pnpm workspace (`apps/*`, `packages/*`) with `nodeLinker: hoisted` set. Expo SDK 57's Metro resolves monorepos automatically (no manual `watchFolders`/`nodeModulesPaths` needed since SDK 52+), and `apps/mobile/metro.config.js` carries none of that legacy configuration.

### Target layout

- `apps/mobile` — the existing Expo app, moved as-is (`app/`, `components/`, `hooks/`, `modules/`, `stores/`, `utils/`, `types/`, `db/` [the on-device SQLite layer stays app-local — it's Expo-SQLite-specific], `lib/`, `constants/`, `assets/`, `ios/`, `android/`).
- `apps/api` — the standalone Hono service: `/commands`, `/sync`, JWT verification, connects to Postgres via `packages/db`.
- `packages/domain` — pure business logic (waterfalls, projections, settlement engine, calendar math), no I/O, Hermes- and Node-compatible. Built as a **compiled package**: its own `tsc` build to `dist/`, cacheable by Turborepo, `exports` field with subpath exports rather than one barrel. (Turborepo's own documentation recommends this pattern for anything needing build caching, over "just-in-time" raw-source packages, and explicitly advises against TypeScript project references — "another point of configuration as well as another caching layer" — in favor of per-package `tsconfig.json` extending a shared base.)
- `packages/protocol` — command/result/effect type contracts shared by `apps/mobile` and `apps/api`.
- `packages/db` — Drizzle **Postgres** schema/migrations, distinct from `apps/mobile`'s existing SQLite `drizzle.config.ts`, which is untouched — two dialects, two configs, never merged.
- `packages/typescript-config` — shared `tsconfig` bases.
- `supabase/` — infra-as-code only: RLS policy migrations, the auth-hook Postgres function, Realtime publication config. No Edge Functions.

### Task graph

`turbo.json` uses the current `"tasks"` key (not the pre-2.x `"pipeline"` key). Tasks: `build` (`dependsOn: ["^build"]`, cached — only `packages/domain`/`protocol`/`db`/`apps/api` build via Turborepo; `apps/mobile` is built by Expo/EAS separately), `check-types` (per-package `tsc --noEmit`, replacing the root `ts:check` script), `lint`/`format` (oxlint/oxfmt — wired into CI as part of this move; today they're defined as scripts but not enforced), `test` (jest, per-package). Root `package.json` scripts become thin `turbo run <task>` wrappers.

### Migration sequence

1. `pnpm-workspace.yaml` gains `packages: ["apps/*", "packages/*"]`.
2. Move all current root app code into `apps/mobile/`; create its own `package.json`. Root `package.json` becomes the thin workspace root.
3. `tsconfig.json`'s `@/*` → `./*` alias moves into `apps/mobile/tsconfig.json`, extending `packages/typescript-config`'s React Native base.
4. `metro.config.js` — no change needed; moves with the app directory.
5. `app.config.ts` — moves with `apps/mobile`; its asset paths stay valid since they're relative to the config file's own location. Verify empirically post-move: the font plugin's hardcoded `./node_modules/@expo-google-fonts/nunito/...` path.
6. `eas.json` and `.eas/` move into `apps/mobile/` (Expo's monorepo guidance requires `eas.json`/`credentials.json` in the app's own directory). Add a `postinstall` script building the workspace's compiled packages before Metro bundles, since EAS Build's install step only installs from the app directory's context.
7. `.github/workflows/*.yml` gain pnpm/turbo filtering in place of bare `pnpm run ts:check`/`pnpm test:ci`; this is also the point at which `lint`/`format`/`check-loose-end` become required CI jobs.
8. `jest.config.js` moves into `apps/mobile/`; its `<rootDir>`-relative paths resolve correctly automatically since `rootDir` shifts with the file.
9. `oxlint.config.ts`'s `ignorePatterns` (`android/app/build`, `dist/*`) need updating once `android/`/`dist/` live under `apps/mobile`.
10. `.gitignore`'s root-anchored `/ios`, `/android` patterns need to become `apps/mobile/ios`, `apps/mobile/android`.
11. `knip.json` adopts knip's monorepo `workspaces` config format.
12. `drizzle.config.ts` (SQLite, `driver: "expo"`) stays in `apps/mobile` unchanged; a new, separate `packages/db/drizzle.config.ts` targets Postgres — never conflated into one config.

`apps/api` consuming `packages/domain` is trivial by design: standard pnpm-workspace `node_modules` symlinking (`"@trove/domain": "workspace:*"`), materially simpler than the Deno import-map path an Edge-Function-hosted design would have needed.

**This migration is the concrete shape of Delivery Sequence Phase 0.** Recommended as two mergeable steps: **Step A** — pure repo restructuring (items 1–12), zero behavior change, verified by `turbo run check-types test` staying green and a real EAS build succeeding from the new location. **Step B** — introduce `apps/api`, `packages/domain` (starting with the `calendar.ts` extraction as a no-behavior-change proof), `packages/protocol`, `packages/db`, and a skeleton Supabase project, as a separate, separately reviewable PR.

## Porting strategy

Moves server-side largely as-is: the settlement engine (`modules/recurring-rules/settlement.ts`), pure calendar math (`calendar.ts`), the revision/discriminated-result/confirmation-token pattern (`change.ts`, `change-results.ts`, `confirmation.ts` — generalized into the template for every command, not just recurring ones), and the per-rule transaction isolation in `runtime.ts`. Built new, from the ADRs: households/roles/invites, the sync substrate, the assignment and card-payment waterfalls, period projections, refund linkage, and historical-adjustment recalculation. Stays client-only: all of `utils/` (presentation formatting) and `modules/ledger-cache.ts` (same matrix, now also fed by remote change effects).

**Explicit seam with the in-flight envelope branches:** this specification depends on the ADRs and `CONTEXT.md` vocabulary — stable — not on the worktrees' file layout, hook shapes, or two concrete shape conflicts already identified: `budget_workspaces` keyed by `currency` alone (no household scoping), and a stored `effective_to_period` column (this spec derives it instead — see [Schema strategy](#schema-strategy)). The branches' pure calculation files (funding-pool math, envelope projections — roughly 600 of their ~6,700 lines) are the intended donors into `packages/domain`.

## Delivery sequence

1. **Phase 0 — Foundations.** The monorepo migration above (Steps A + B); extract `calendar.ts` into `packages/domain` as a no-behavior-change proof; a Supabase project with Postgres, Auth, and RLS only (no Edge Functions), with households/members/invites; an `apps/api` skeleton with JWT verification and a health check; the invite-flow UI. CI gains `supabase start` plus a pgTAP RLS negative-test suite, per-package `lint`/`format`/`check-loose-end`, and a container build for `apps/api`. No app data syncs yet.
2. **Phase 1 — Sync substrate and ledger.** Accounts, categories, and transactions become server-authoritative: `household_changes`, `/commands`, `/sync`, the client outbox and sync worker, optimistic apply/writeback. Neutralize `DATABASE_RESET_VERSION` (today it wipes every table on a version bump; it would now destroy an unsynced outbox).
3. **Phase 2 — Recurring Rules server-side** _(parallelizable with Phase 3)_. Port the settlement engine behind a Postgres persistence adapter; a scheduled per-rule-timezone settlement job.
4. **Phase 3 — Envelope/budget domain server-side** _(parallelizable with Phase 2)_. The full schema, waterfalls, and projections from this document; commands for mapping changes, funding membership changes, assignments, card payments, refunds, and budget reset.
5. **Phase 4 — Realtime and collaboration UX.** The live channel and delta pull; activity history from `household_changes`; the Rejected Changes inbox; the private-account visibility toggle.
6. **Phase 5 — Hardening and rollout.** RLS audit; a migration runbook with staging dry-runs; the local-to-cloud import below; backups/PITR; observability; a kill switch back to local-only; staged rollout via `expo-updates`.

## Migration path for existing local-only installs

Opt-in, never forced — solo/local-only mode remains fully supported. On "Enable Sync": create a household → the client uploads existing local data as chunked, idempotent `import_bundle` commands, dependency-ordered (accounts → categories → recurring rules/occurrences → transactions → budgeting facts). The server recomputes a manifest (row counts, per-account transaction sums, assignment sums per currency) from the imported rows and compares it against a client-computed manifest; only on a match does the client flip to synced mode and re-seed its cache from `/sync?since=0`, rather than trusting the upload was lossless. The pre-import SQLite file is retained as a backup until the user confirms, mirroring Invariant 5's archive-not-delete discipline applied to the migration itself. Joining an _existing_ household with local data is never auto-merged — the user explicitly chooses to import into that household or keep their local data as a solo archive.

## Explicit non-goals

- No bank aggregation / Plaid / open banking.
- No CRDTs, no field-level operational transform, no real-time collaborative editing of a single record — server-authoritative with rejection is the model.
- No end-to-end encryption (incompatible with server-computed projections).
- No web client, no accountant portal beyond the `viewer` role's existence.
- No cross-household sharing, no household-to-household transfers.
- No server-side currency conversion — Unsupported Currency Transfers stay flagged, never converted (ADR-0002).
- No change to the ADRs' single-owner budget semantics — the household is the owner (see [Household-scoped budgeting fact](#household-scoped-budgeting-fact)).

## Open risks

- **Multi-currency households** need a product decision before the Phase 3 schema is cut: ADR-0002 forbids conversion and assumes one Home Currency, ambiguous once two household members are in different countries. The one decision most likely to reshape the schema if deferred too long.
- **Concurrent assignments to the same envelope/workspace** are handled correctly by the per-currency advisory lock plus re-validated preconditions; the remaining work is UX — explaining a rejection well ("Sara assigned $200 to Groceries while you were offline; only $50 remains").
- **The in-flight envelope branches are a moving target** — the two shape conflicts in [Porting strategy](#porting-strategy) should be raised with that stream now.
- **Privacy positioning changes**: `db/reset.ts` currently documents "everything stays on-device, no sync or backup." Shipping a server is a real change to that promise, needing deliberate messaging and decisions on data residency, retention, export/deletion (App Store requires in-app account deletion once accounts exist).
- **`apps/api` hosting target and autoscaling policy** are undecided — portable by design, but a concrete first host is still needed for Phase 0, along with connection-pool sizing against Supabase's Postgres connection limits as `apps/api` scales to multiple replicas.
- **Large historical recalculations** (ADR-0005 cascades) deserve bounded, resumable design even without a hard CPU cap — a single request shouldn't hold a transaction open indefinitely against a shared connection pool.

## Acceptance criteria

- `pnpm ts:check` (`turbo run check-types`) and `pnpm test:ci` (`turbo run test`) stay green throughout every phase — no phase regresses the existing client test suite, since `packages/domain` extraction is a no-behavior-change refactor at each step.
- The existing 492-line `recurring-rules.test.ts` suite passes unmodified against the new Postgres persistence adapter in Phase 2 — same scenarios, two backends.
- An ADR-indexed golden-scenario suite (one fixture per relevant ADR) passes for the envelope/budget domain in Phase 3, plus invariant tests (Assigned + Unassigned + reserves reconciles to Funding Pool).
- A pgTAP RLS negative-test suite proves cross-household reads/writes are rejected, for every table, from Phase 0 onward.
- An airplane-mode end-to-end test and a fuzz test replaying randomized two-client command interleavings both converge to the same server state, from Phase 1 onward.
- Two-simulator manual QA (this repo already has argent-based device automation available) verifies Realtime propagation and a poll-only fallback in Phase 4.
- A staging-environment import dry-run against a snapshot of a real-shaped local database completes with a manifest match, before Phase 5 rollout.
