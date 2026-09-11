# Ledger scope prefactor

What #226 put in place, and the contracts #227 and #228 build on. Decision and rationale live in [ADR 0026](../adr/0026-scope-ledgers-to-a-user-or-an-organization.md).

## The contract

A **Ledger** owns financial rows. It is owned by one User or by one WorkOS Organization:

```ts
type LedgerScope =
  | { readonly type: "personal"; readonly userId: string }
  | { readonly type: "organization"; readonly organizationId: string };
```

Ledger ids are derived, not allocated: `personal:<workos-user-id>` for personal scope, and the organization's own id for organization scope. `packages/protocol/src/ledger-scope.ts` is the only place that knows this encoding — `ledgerIdForScope` and `parseLedgerId` round-trip, so nothing downstream should build the string itself.

Commands declare scope on the wire and the server resolves it:

```ts
{ commandId, kind, payload, scope: { type: "personal" } }
{ commandId, kind, payload, scope: { type: "organization", organizationId } }
{ commandId, kind, payload, householdId }  // read as organization scope
```

Personal scope carries no identifier. It resolves against the Authentication Session's subject, so a client cannot address a Ledger it does not own; sending someone else's user id is not possible because there is no field for it.

## What each layer sees

| Layer     | Keys on                                                                        |
| --------- | ------------------------------------------------------------------------------ |
| Database  | `ledger_id NOT NULL` on ledger, change-log, result, and sequence tables        |
| API       | `PlanContext.ledgerId`; `householdId` is `string \| null`                      |
| PowerSync | `personal_ledger` auto-subscribes by `auth.user_id()`; `household_*` unchanged |
| Mobile    | `SyncedLedgerBinding { ledgerId, scope, householdId }`                         |

Handlers filter and insert by `ctx.ledgerId`. Household-only handlers take `HouseholdPlanContext`, which narrows `householdId` to `string`; the pipeline only routes to them after checking `supportsPersonalScope`, so that narrowing holds at runtime.

## For #227 — envelopes, assignments, recurring

Budgeting and recurring tables are still Household-keyed and their handlers still reject personal scope. Extending them means:

1. Add `ledger_id NOT NULL` to `envelopes`, `assignments`, `category_mappings`, `rollover_settings`, `budget_workspaces`, and `recurring_rules`, backfilled from `household_id` the way migration `0011_ledger_scope.sql` does it.
2. Change those handlers from `HouseholdPlanContext` back to `PlanContext` and set `supportsPersonalScope: true`.
3. Add the rows to the `personal_ledger` sync stream using the same `ledger_id IN (SELECT id FROM ledger WHERE personal_user_id = auth.user_id())` subquery.
4. Drop the mobile fallbacks that route a personal Ledger to the on-device budgeting and recurring modules — `useBudgetingCoordinator` and `RecurringRulesProvider` both branch on `binding.householdId !== null` today.

Append-only assignment history and the envelope invariants are untouched by scope; the ledger-keyed composite foreign keys on `transactions` are the pattern to copy for keeping envelope references inside one Ledger.

## For #228 — Households on WorkOS Organizations

Two pieces of scaffolding exist only until Households become WorkOS Organizations, and #228 owns removing both:

**The mirror trigger.** `mirror_household_organization_ledger()` in migration `0011_ledger_scope.sql` inserts an organization Ledger for every Household row, so Household creation keeps working without touching the household code path. When Households are created as Organizations they should write their own Ledger row and the trigger should be dropped.

**Dual-written `household_id`.** Ledger tables still carry a nullable `household_id` alongside `ledger_id`, and organization rows set both — a CHECK constraint enforces it. Reads should move onto `ledger_id`, then the column can go.

While an organization Ledger's id equals its Household id, `organizationId` on the wire is the Household id. When Households gain real WorkOS Organization ids, `organizationLedgerId` is the single function that has to change, and existing organization Ledger rows need their ids remapped.

## Invariants to preserve

- Money stays integer minor units.
- `commandId` is the idempotency key, now scoped per Ledger: the same id in two Ledgers is two Commands.
- One Command commits in one batch, including its change-log row and result.
- Rows never cross Ledgers — an Account and the Category it is booked against must resolve within one Ledger.
