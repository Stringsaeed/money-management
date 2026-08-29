# Ledger Cache Coherence Plan

- **Status:** Implemented; ownership boundary revised by #132
- **Recorded:** 2026-08-17
- **Source review:** `architecture-review-20260816-204716.html`, “Own ledger cache coherence”
- **Domain language:** [Money Management Context](../../CONTEXT.md)

## Purpose

Give one module ownership of the in-process React Query cache topology for ledger data. Database writers will report semantic domain changes; the coherence module will decide which cached projections must become stale and will await refresh attempts for active projections.

This repairs confirmed stale-data paths, prevents raw query-key knowledge from spreading through mutation hooks, and establishes one place to extend when a new ledger-derived view is added.

## Current defects

Query keys and invalidation rules currently live across `use-accounts.ts`, `use-categories.ts`, `use-transactions.ts`, and `recurring-effects.ts`.

The resulting gaps are observable:

- Account metadata edits can leave cached enriched Transactions with old Account names, colors, icons, or currencies.
- Category edits and deletion can leave cached enriched Transactions with old Category data.
- Category deletion sets `recurring_rules.category_id` to `null`, but cached Recurring Rules are not refreshed.
- Transaction creation, editing, and deletion do not invalidate the cached Transaction date range.
- Cascading Account deletion can change the Transaction date range without invalidating it.
- Most ordinary mutation callbacks do not return their invalidation promises, so `mutateAsync()` can settle before active views finish their refresh attempts.
- Raw key literals are duplicated across writers, so adding a derived view requires finding every mutation path that might affect it.

## Goals

- Keep cache topology and raw query-key shapes in one module.
- Make every app-owned ledger write report a typed semantic change.
- Conservatively invalidate every projection affected by that change.
- Await active refetch attempts before a mutation settles.
- Mark inactive affected queries stale without eagerly fetching them.
- Preserve existing hook APIs, navigation, loading states, and visible UI behavior.
- Preserve the Recurring Rules module's existing semantic-effect protocol and partial-settlement behavior.
- Prove the ownership boundary and active/inactive cache behavior with focused tests.

## Non-goals

- Detect writes made by another process, a future sync engine, imports, or external database tooling.
- Introduce cache persistence, database observation, event sourcing, or multiwriter synchronization.
- Move React Query key or semantic-effect ownership out of the coherence module.
- Patch enriched query data manually or add optimistic cache updates.
- Add field-level dependency analysis, query predicates, a coherence queue, or debouncing.
- Change query-key shapes as part of the ownership migration.
- Redesign any product flow or expose new UI.

## Agreed consistency contract

The first delivery provides strong in-process coherence for app-owned writes:

1. A database write commits through its current hook or domain coordinator.
2. The writer reports one typed semantic change to the coherence owner.
3. The owner marks every affected cached projection stale.
4. React Query refetches affected active queries and leaves inactive queries stale.
5. The mutation waits until those active refetch attempts settle.
6. A refresh failure remains a query error; it does not turn an already committed database write into a failed mutation.

The implementation will use TanStack Query's default invalidation behavior: active matches refetch, inactive matches remain stale, and refetch failures are retained by their queries rather than thrown through the invalidation promise.

Concurrent successful writes will call the coherence owner independently. No global queue, debounce, or manual refetch coordination will be introduced.

## Ownership boundary

Add one pure module under `modules/` that accepts a `QueryClient`. It will own:

- Account query-key factories;
- Category query-key factories;
- Transaction list, detail, summary, and date-range query-key factories;
- Account-balance query keys;
- Recurring Rule query-key factories;
- semantic Ledger-change-to-query mappings;
- existing Recurring-effect-to-query mappings; and
- full-ledger reset invalidation.

React hooks own React Query orchestration, cache-effect reporting, and form-facing APIs. The owned ledger data-source coordinator introduced by #132 now owns source selection, while its local SQLite and synced oRPC adapters own persistence and transport details behind common Account, Category, and Transaction resource contracts. Selection is explicit (`local` by default or a configured `synced` Household); neither adapter falls back to the other. Source-specific hydration, writeback, offline state, errors, and local-only lifecycle operations remain discriminated capabilities rather than leaking storage details into hooks.

The Recurring Rules domain continues to produce its current semantic effects. Background settlement, sync hydration, and developer reset paths call the same coherence owner without needing a second query-key map. `modules/ledger-cache.ts` remains the sole production owner of query-key factories and Effect Tag mappings.

The module should expose pure functions rather than a provider or global QueryClient singleton. Proposed API shape:

```ts
type LedgerChange =
  | { kind: "account.created"; id: string }
  | { kind: "account.updated"; id: string }
  | { kind: "account.deleted"; id: string }
  | { kind: "category.created"; id: string }
  | { kind: "category.updated"; id: string }
  | { kind: "category.deleted"; id: string }
  | { kind: "transaction.created"; id: string }
  | { kind: "transaction.updated"; id: string }
  | { kind: "transaction.deleted"; id: string }
  | { kind: "ledger.reset" };

declare function cohereLedgerCache(queryClient: QueryClient, change: LedgerChange): Promise<void>;

declare function cohereRecurringEffects(
  queryClient: QueryClient,
  effects: readonly RecurringEffect[],
): Promise<void>;
```

Names may be tightened during implementation, but the semantic boundary must remain: ordinary writers report domain changes, while the Recurring Rules module keeps reporting its established domain effects.

Entity identifiers remain part of ordinary change objects for targeted detail handling and diagnostics. Full records, changed-field lists, and before/after snapshots are intentionally excluded.

## Coherence matrix

The implementation will preserve current key shapes and apply conservative operation-level mappings.

| Semantic change       | Cached projections made stale                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `account.created`     | Account lists and Account balances                                                                                           |
| `account.updated`     | Account lists/details, Account balances, enriched Transactions, and Recurring Rules                                          |
| `account.deleted`     | Account lists/details, Account balances, enriched Transactions, month summaries, Transaction date range, and Recurring Rules |
| `category.created`    | Category lists                                                                                                               |
| `category.updated`    | Category lists/details and enriched Transactions                                                                             |
| `category.deleted`    | Category lists/details, enriched Transactions, and Recurring Rules                                                           |
| `transaction.created` | Transactions, Account balances, month summaries, and Transaction date range                                                  |
| `transaction.updated` | Transactions, Account balances, month summaries, and Transaction date range                                                  |
| `transaction.deleted` | Transactions, Account balances, month summaries, and Transaction date range                                                  |
| `ledger.reset`        | Every cached query                                                                                                           |

Account and Category updates intentionally avoid changed-field inspection. The extra invalidation is cheap for a local SQLite application and prevents dependency knowledge from leaking back into writers.

The existing Recurring effect mapping remains semantically unchanged:

| Recurring effect | Cached projections made stale              |
| ---------------- | ------------------------------------------ |
| `rules`          | Recurring Rule lists and details           |
| `upcoming`       | Upcoming Recurring Rules                   |
| `ledger`         | Transactions                               |
| `balances`       | Account balances                           |
| `summaries`      | Month summaries and Transaction date range |

Duplicate keys produced by one change or effect set will be invalidated once.

## Mutation migration

### Accounts

- `useCreateAccount` reports `account.created` with the inserted ID.
- `useUpdateAccount` reports `account.updated` after the Account/Recurring transaction commits.
- `useDeleteAccount` reports `account.deleted` after coordinated deletion commits.
- The hooks remove every direct `invalidateQueries()` call and raw query key.

### Categories

- `useCreateCategory` reports `category.created`.
- `useUpdateCategory` reports `category.updated`.
- `useDeleteCategory` reports `category.deleted` after SQLite has nulled affected Transaction and Recurring Rule references.

### Transactions

- Create, update, and delete report their corresponding semantic changes.
- All three operations gain Transaction-date-range coherence through the centralized mapping.

### Recurring Rules and settlement

- Move `recurringRuleKeys` and the current effect mapping into the new owner.
- Route successful recurring changes and settlement reports through `cohereRecurringEffects`.
- Preserve `RecurringSettlementError` handling: effects for partially committed work are still applied.
- Update the foreground settlement provider to call the new owner.
- Delete `hooks/recurring-effects.ts`; do not retain a forwarding wrapper or second owner.

### Full reset

- Keep the developer erase-all SQL orchestration in Settings.
- Replace its direct broad invalidation call with `ledger.reset`.

## Testing strategy

### Coherence-owner tests

Add focused tests beside the new module that prove:

- every `LedgerChange` maps to the projections in the coherence matrix;
- Recurring effects retain their current mapping;
- duplicate affected keys are invalidated once;
- the returned promise waits for every invalidation call;
- a real active query finishes its refetch attempt before coherence resolves;
- a real inactive query is marked stale without being fetched; and
- a failed active refetch remains a query error while coherence resolves normally.

Use a real `QueryClient`/`QueryObserver` only for TanStack behavior. Use a controlled or mocked client for exhaustive semantic mapping assertions.

### Adapter tests

Update Account, Category, Transaction, Recurring Rule, foreground-settlement, and reset tests so they assert the semantic change or Recurring effects delegated by each caller. They must not repeat raw query-key assertions.

The combination establishes two independent contracts:

1. writers report the correct domain change; and
2. the owner produces coherent cached outcomes for that change.

Full SQLite-backed mutation/view permutations are unnecessary for this delivery because existing database and domain suites already cover write semantics. The new tests target the missing cache boundary.

## Planned file impact

- Add the ledger cache coherence module and its tests under `modules/`.
- Update `hooks/use-accounts.ts` and its tests.
- Update `hooks/use-categories.ts` and its tests.
- Update `hooks/use-transactions.ts` and its tests.
- Update `hooks/use-recurring-rules.ts` and its tests.
- Update `components/recurring/recurring-settlement-provider.tsx` and its tests if needed.
- Update `app/(tabs)/settings/index.tsx` and its reset test if present.
- Delete `hooks/recurring-effects.ts` after all imports migrate.

No database schema, migration, screen layout, navigation, or UI-copy changes are planned.

## Delivery sequence

1. Add centralized key factories, semantic change types, effect mappings, and pure coherence functions.
2. Add exhaustive mapping tests and real QueryClient behavior tests.
3. Migrate Account hooks and replace raw invalidation assertions with semantic delegation assertions.
4. Migrate Category hooks, including joined-Transaction and deleted-Rule coherence.
5. Migrate Transaction hooks and close the Transaction-date-range gap.
6. Migrate Recurring Rule hooks and the foreground settlement provider while preserving partial effects.
7. Route developer reset through `ledger.reset`.
8. Delete the obsolete recurring-effects helper and confirm no raw ledger key literals remain outside the owner and tests that intentionally seed cache state.
9. Run targeted tests, strict TypeScript, lint fixing, formatting, and the complete CI test suite.
10. Review the final diff and create one focused Conventional Commit.

## Verification

Required automated checks:

```sh
pnpm jest modules/ledger-cache.test.ts hooks/use-accounts.test.tsx hooks/use-categories.test.tsx hooks/use-transactions.test.tsx hooks/use-recurring-rules.test.tsx --runInBand --watchman=false
npx tsc --noEmit
pnpm lint:fix
pnpm format
pnpm test:ci
```

Adjust the focused test path if implementation uses a `modules/ledger-cache/` directory.

This work has no intended visual change, so simulator QA is not required unless implementation unexpectedly affects mutation loading, navigation, or visible error behavior.

## Acceptance criteria

- Account and Category edits cannot leave active enriched Transaction queries showing old joined metadata after the mutation settles.
- Category deletion cannot leave active Recurring Rule queries showing the deleted Category reference after the mutation settles.
- Transaction create, update, delete, and cascading Account deletion mark Transaction date range stale and refresh it when active.
- Inactive affected queries are stale but are not eagerly fetched.
- Refresh errors remain owned by their queries and do not misreport a committed write as failed.
- All app-owned Account, Category, Transaction, Recurring, settlement, and reset paths delegate cache coherence to one module.
- Query-key shapes appear in one production owner; writers contain no raw cache-key literals.
- The old recurring-effects helper is removed.
- Existing hook APIs and UI behavior remain unchanged.
- TypeScript, lint, formatting, targeted tests, and the complete Jest CI suite pass.

## Risks and controls

- **Missed write path:** search production code for `invalidateQueries`, known ledger key literals, and direct table mutations before completion.
- **Accidental duplicate refetch:** deduplicate mapped keys and avoid overlapping broad/detail invalidations where one prefix already covers both.
- **Committed-write error ambiguity:** keep TanStack's default non-throwing refresh behavior.
- **Recurring regression:** preserve the current effect protocol and partial-settlement report exactly; change only the cache adapter.
- **Scope expansion:** retain current key shapes, hooks, SQL ownership, and UI behavior; defer observation and synchronization concerns.
