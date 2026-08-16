# Recurring Rules Architecture

- **Status:** Design complete; implementation not started
- **Recorded:** 2026-08-16
- **Decision history:** [Recurring Rules Decision Log](./recurring-rules-decision-log.md)
- **Domain language:** [Money Management Context](../../CONTEXT.md)

## Purpose

Replace the shallow recurring-payment CRUD path and launch-only processor with a deep Recurring Rules module that owns authoring, scheduling, settlement, lifecycle, repair, persistence, and migration semantics.

The design protects financial history, prevents duplicate generation, makes failures visible, and keeps the module local-first while preserving identities and invariants suitable for a future multiwriter environment.

## Scope

The first delivery is a complete essential vertical slice:

- migrate the existing recurring data model;
- introduce the deep Recurring Rules module;
- migrate current React Query callers and screens;
- settle due Occurrences automatically;
- support lifecycle and health actions;
- preview user-triggered materialization;
- expose nonblocking settlement status;
- coordinate Account deletion atomically; and
- delete the replaced shallow implementation and tests.

Rich Occurrence-history browsing, advanced recurrence expressions, synchronization, event sourcing, and ordinary hard deletion are outside this delivery.

## Canonical model

### Recurring Rule

A Recurring Rule is a durable instruction for producing future ledger transactions. It owns:

- one daily, weekly, monthly, or yearly cadence;
- an inclusive start date that anchors the cadence;
- an optional inclusive end date or occurrence-count limit;
- a captured IANA time zone;
- exact Money;
- transaction content and required Account relationships;
- lifecycle and health;
- a prospective Eligibility Floor; and
- an integer Rule Revision.

A Rule is distinct from every transaction it creates.

### Occurrence

An Occurrence is one scheduled local date implied by a Rule. Its canonical identity is:

```text
(ruleId, scheduledDate)
```

Future dates are derived. An Occurrence becomes durable only during Settlement. Once recorded as settled, it can never produce another Generated Transaction.

### Generated Transaction

A Generated Transaction is a historical snapshot created from one Occurrence. It is editable and deletable like any other ledger transaction. Editing or deleting it does not change its Rule and does not reopen its Occurrence.

Visible source lineage remains attached while the Generated Transaction exists.

### Money

Money is represented as integer minor units paired with an ISO currency code. Floating-point values are not accepted by the module interface or used as the Rule's storage authority.

## Invariants

1. A Rule implies at most one Occurrence for a scheduled date.
2. A Settled Occurrence can never produce a second Generated Transaction.
3. A Generated Transaction is an independent historical snapshot.
4. Only a Ready, Active Rule may settle.
5. Paused and Archived intervals never become a deferred backlog.
6. A Needs-Attention Active Rule accrues its due backlog until repaired.
7. Completion count is based on Settled Occurrences, not skipped cadence slots.
8. User changes cannot overwrite a newer Rule Revision.
9. Each Rule settles atomically; failure in one Rule does not roll back unrelated Rules.
10. Ordinary product flows never hard-delete Rules or Occurrences.

## Lifecycle and health

Lifecycle and health are independent discriminated values, not loose boolean flags.

### Lifecycle

- **Active:** eligible to produce Occurrences.
- **Paused:** temporarily ineligible; dates in the paused interval are skipped.
- **Archived:** retained for lineage and excluded from future production until restored.
- **Completed:** naturally exhausted by its inclusive end date or occurrence count.

### Health

- **Ready:** financial dependencies are coherent.
- **Needs Attention:** a required Account, transfer destination, currency relationship, amount, or migrated value requires repair.

### Combined behavior

| Lifecycle | Ready                        | Needs Attention                             |
| --------- | ---------------------------- | ------------------------------------------- |
| Active    | Settles every due Occurrence | Accrues backlog; Settlement is blocked      |
| Paused    | Skips dates                  | Skips dates; repair does not resume it      |
| Archived  | Skips dates                  | Skips dates; repair does not restore it     |
| Completed | Produces no dates            | Produces no dates; extension revalidates it |

Repair changes health to Ready without changing lifecycle.

## Calendar semantics

- Cadences are daily, weekly, monthly, or yearly, with an interval count.
- Each cadence interval produces at most one date.
- Start and end dates are inclusive.
- The explicit start date remains the cadence anchor through ordinary edits.
- Explicitly changing the start date reanchors future dates.
- If a requested monthly or yearly date does not exist, use that period's final valid date. Examples include February 28 for a non-leap-year February 29 and April 30 for an intended April 31.
- Calendar evaluation uses the Rule's captured time zone and date-only values.
- A time-zone change is explicit and prospective. Today settles under the old zone before the change commits.
- Pausing, archiving, or editing on a due date first settles that date under the old Rule.
- Restoring an Archived Rule is prospective; its archived interval is skipped.
- Extending a Completed Rule begins at the first anchored date after the extension; it does not backfill the completed gap.

## Change semantics

### Prospective editing

When a Rule is edited:

1. determine all dates due under the observed Rule Revision through today;
2. return a preview if the user action would materialize any Occurrences;
3. after confirmation, settle those dates under the old Rule;
4. apply the prospective edit; and
5. commit Settlement and the edit in one transaction.

If any part fails, neither Settlement nor the edit commits.

### Pause and archive

Pause and archive use the same old-state-first ordering. On resume or restore, the Eligibility Floor advances so the skipped interval cannot become a backlog.

Archive replaces ordinary deletion. It is reversible and preserves lineage. Only full app-data reset may purge archived Rules and Occurrences.

### Repair

Repair is the deliberate exception to old-terms backlog ownership:

- it previews the accrued backlog using the proposed repaired values;
- confirmation applies the repair and settles that backlog atomically; and
- it restores Ready health without changing lifecycle.

### Confirmation

Any user action that would first materialize overdue Occurrences returns a preview containing at least count, total, and affected date range.

Confirmation uses an opaque, short-lived, single-use in-memory token bound to:

- the canonical intent;
- the observed Rule Revision, when applicable;
- the Rule-local date;
- relevant Account and currency state; and
- the computed preview.

A restart, dependency change, revision change, or date change invalidates the token and requires a new preview. Confirmation tokens are not persisted.

## Settlement

### Triggers

Settlement runs:

- after the database is ready on launch;
- whenever the app enters the foreground; and
- when an explicit domain change requires old-state Settlement.

Concurrent requests coalesce into one in-flight run.

### Rule-local algorithm

For each eligible Rule, Settlement:

1. validates required Account and currency relationships;
2. derives every scheduled date from the Eligibility Floor through the Rule-local current date;
3. removes dates already represented by durable Occurrences;
4. creates a Generated Transaction and Settled Occurrence for every remaining date;
5. advances completion when the inclusive end condition is fulfilled; and
6. commits the Rule atomically.

Unrelated Rules continue if one Rule fails. Storage uniqueness on `(rule_id, scheduled_date)` is the final duplicate-generation guard.

### Outcomes and failures

Expected domain outcomes are discriminated values, including invalid intent, stale revision, preview required, missing Rule, and Needs Attention.

Unexpected storage failures throw. Settlement completes independent Rules, then throws an aggregate error containing the partial per-Rule report and original causes. Per-Rule failure metadata is persisted when storage remains writable; the current aggregate error always remains available in memory.

## Module design

The module is physically local under `modules/recurring-rules/` with one small public entry and private implementation files.

```text
React Query adapters ─────────┐
Root Settlement runtime ──────┼──> Recurring Rules module
Account-deletion coordinator ─┘       read
                                      change
                                      settle
                                         |
                                         +-- private calendar implementation
                                         +-- private persistence implementation
                                         +-- private confirmation implementation
```

### Public interface

The core exposes three entry points:

```ts
interface RecurringRules {
  read(query: RecurringRead): Promise<RecurringReadResult>;
  change(intent: RecurringChange): Promise<RecurringChangeResult>;
  settle(request?: SettlementRequest): Promise<SettlementReport>;
}
```

`read` initially supports list, detail, and upcoming projections. Status is embedded in those results; full Occurrence history is not public in the first delivery.

`change` accepts explicit domain intents rather than CRUD payloads. Existing-Rule changes require `expectedRevision` and include actions such as edit, pause, resume, archive, restore, repair, and time-zone change.

`settle` owns due-date discovery, materialization, progress, coalescing, and reporting.

### Change effects

Successful operations return semantic effects rather than React Query keys:

- `rules`
- `upcoming`
- `ledger`
- `balances`
- `summaries`

React adapters translate those effects into caller-specific invalidation.

### Dependencies and testing seam

The module is constructed with concrete database, clock, and identity implementations. It does not expose public repository or persistence-port abstractions.

The primary test surface is the public module interface backed by in-memory SQLite. Direct calendar tests remain for dense recurrence edge cases. Mocked builder and processor tests replaced by module tests are deleted.

## Persistence model

### `recurring_rules`

The Rule record includes:

- preserved Rule ID;
- cadence and inclusive bounds;
- captured IANA time zone;
- amount minor units and currency;
- nullable source Account, destination Account, and category references;
- lifecycle and health discriminants;
- health reason and repair metadata when needed;
- Eligibility Floor;
- integer revision; and
- creation, update, lifecycle, health, and failure timestamps.

Required Account fields may be null only while health is Needs Attention. Categories remain optional and do not block Settlement.

### `recurring_occurrences`

Each durable Settled Occurrence contains:

- Rule ID;
- scheduled local date;
- settlement timestamp; and
- a nullable Generated Transaction reference using `ON DELETE SET NULL`.

The Rule ID and scheduled date form the canonical unique identity.

### Transactions

Generated Transactions preserve visible Rule lineage. They remain independently editable and deletable. The new implementation does not use a transaction's presence as proof that an Occurrence is unsettled.

## Account coordination

Deleting a required source Account or transfer destination must:

1. preview the affected Rules in the deletion confirmation;
2. archive each affected Rule;
3. detach the deleted Account reference;
4. mark the Rule health Needs Attention; and
5. delete the Account.

A narrow application transaction coordinator invokes private Account and Recurring Rules operations within one SQLite transaction. Neither module takes ownership of the other's domain.

Changing an Account's currency marks affected Rules Needs Attention until their amount and currency relationship is explicitly repaired. Historical Generated Transactions do not change.

## React and UI integration

- Keep the existing shared `TransactionForm` as the Rule authoring surface.
- Keep the existing Rule detail route and add lifecycle, health, preview, confirmation, and repair behavior around the form.
- Use caller-friendly named React Query hooks as thin adapters over `read`, `change`, and `settle`.
- Exclude Archived Rules from the default list and provide an explicit Archived filter with restore actions.
- Show per-Rule lifecycle, health, and unresolved settlement information.
- Use “Recurring” in compact navigation and “Recurring Rule” where a noun is required. Remove user-facing “Recurring Payment” language because Rules may represent income or transfers.
- Show successful Settlement summaries transiently in a dismissible root-level banner.
- Keep unresolved items visible and link the banner to the appropriately filtered Recurring list.

Rich history browsing is deliberately deferred.

## Legacy migration

Migration is a single versioned SQLite transaction. It validates invariants before removing legacy structures and rolls back completely on failure.

For each existing Rule:

1. preserve its ID and transaction lineage;
2. assign the device's current IANA time zone once;
3. map `isActive: false` to Completed when its end condition is already fulfilled, otherwise Paused;
4. convert exact amounts to currency minor units;
5. preserve non-convertible legacy values as repair metadata and mark the Rule Needs Attention;
6. reconstruct every scheduled Occurrence through `lastGeneratedDate`;
7. attach a transaction only when the Rule-local date match is unambiguous; and
8. preserve duplicate or unmatched transactions with legacy Rule lineage without inventing extra Occurrences.

After migration, normal automatic Settlement catches up Ready, Active Rules. Needs-Attention Rules remain blocked. The legacy table shape, processor, hooks, mapper, and replaced tests are then removed; no compatibility path remains.

## Delivery sequence

Implementation should proceed in focused, verifiable commits:

1. Add schema and atomic legacy migration with invariant checks.
2. Add calendar behavior and deep module tests against in-memory SQLite.
3. Implement `read`, `change`, `settle`, confirmation, revisions, and semantic effects.
4. Add the root Settlement runtime and React Query adapters.
5. Add Account-deletion coordination.
6. Migrate Rule screens, lifecycle actions, repair, filters, and root feedback.
7. Delete the replaced shallow path and obsolete tests.
8. Run type checking, focused tests, the complete test suite, lint fixing, formatting, and simulator QA.

## Acceptance criteria

- No duplicate Generated Transaction can arise for the same Rule and scheduled date.
- Every active, ready, due Occurrence eventually settles after launch or foregrounding.
- Paused and Archived intervals never backfill.
- Needs-Attention Active Rules catch up after confirmed repair.
- User-triggered materialization is previewed and confirmed.
- Rule edits cannot overwrite a newer revision.
- Generated Transaction edits and deletion never reopen Occurrences.
- Account deletion archives and detaches affected Rules atomically.
- Legacy data migration is lossless and rollback-safe.
- Existing authoring remains in the shared Transaction form.
- Unexpected failures are visible without blocking unrelated Rules.
- The old recurring processor and shallow persistence hooks no longer exist.

## Explicit non-goals

- synchronization or a sync adapter;
- RFC RRULE or multiple dates per cadence interval;
- persisted confirmation tokens;
- public repository interfaces;
- event sourcing or revision history;
- a full user-facing Settlement history;
- rich Occurrence-history browsing; and
- ordinary hard deletion of Rules or Occurrences.
