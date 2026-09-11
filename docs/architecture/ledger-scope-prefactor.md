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

Done. Migration `0012_budget_recurring_ledger_scope.sql` adds `ledger_id NOT NULL` (backfilled from `household_id`) to budget and recurring tables, dual-write CHECKs, and ledger-scoped composite uniques/FKs. Handlers `budget.configure`, `assignment.commit`, `assignment.correct`, `refund.link`, and `recurring.change` take `PlanContext` with `supportsPersonalScope: true` and key rows by `ctx.ledgerId`. Settlement fans out by `ledger_id`, so a Personal Ledger settles without a Household. The `personal_ledger` stream now includes those tables (recurring keeps private-account filters). Mobile synced coordinators bind on `selection.kind === "synced"` and command envelopes carry `scope`, not a Household fallback.

Membership and import stay Household-only. `mirror_household_organization_ledger` is untouched — #228 owns it.

## Remaining cleanup for #228 / #229

- #228: drop the Household→organization Ledger mirror trigger once Households write their own Ledger rows; remap organization Ledger ids if they stop equaling Household ids.
- #228: after reads are fully on `ledger_id`, drop the nullable dual-written `household_id` (CHECK included).
- #229: onboarding/import of on-device rows onto a Personal Ledger. A personal sync still starts empty.

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
