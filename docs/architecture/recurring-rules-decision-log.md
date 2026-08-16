# Recurring Rules Decision Log

- **Status:** Complete design record
- **Recorded:** 2026-08-16
- **Normative design:** [Recurring Rules Architecture](./recurring-rules-design.md)
- **Domain language:** [Money Management Context](../../CONTEXT.md)

## Why this record exists

The recurring-payment deepening was shaped through a structured grilling process rather than implemented from the initial idea. This log preserves the complete decision trail, including the explored interface families, so later changes can distinguish deliberate constraints from accidental implementation details.

The user selected the recommended answer throughout. Q69 supersedes the original single-state formulation in Q28 after later scenarios revealed that lifecycle and health are independent concepts.

On 2026-08-17, the implemented authoring locality was tightened further: Q71's shared-form decision remains, but its separate Rule-detail route was superseded. `app/transaction/[id].tsx` is now the single editor and preview surface for transactions and Recurring Rules. Healthy lifecycle state is communicated by the screen surface and accessible header actions; only Needs Attention receives an in-content warning banner.

## Process

1. Establish canonical domain language and the intended module depth.
2. Resolve lifecycle, Settlement, failure, and concurrency semantics.
3. Resolve calendar, historical-snapshot, Account, and repair behavior.
4. Decide persistence authority and future-multiwriter invariants.
5. Compare three independently designed public-interface families.
6. Select a hybrid interface and shape its reads, changes, effects, and failures.
7. Resolve legacy migration and cross-module orchestration.
8. Revisit the state model when health proved orthogonal to lifecycle.
9. Close the final calendar, authoring, terminology, and feedback frontier.

## Interface designs considered

### Minimal three-entry core

`read`, `change`, and `settle` provide a very small interface over a deep implementation. This maximizes leverage and keeps orchestration inside the module.

### Extensible four-entry catalog

`read`, `enact`, `confirm`, and `settleDue` use catalogs, branded identifiers, pagination, and explicit status types. This is extensible but adds machinery without current callers that need it.

### Caller-optimized named core

Named methods such as `list`, `get`, `upcoming`, `create`, `edit`, `pause`, `restore`, `repair`, `archive`, and `settleDue` are easy to discover but make the core interface substantially wider.

### Selected hybrid

The selected design uses the minimal three-entry core and caller-friendly named React adapters. It borrows expected revisions, branded date/time-zone concepts, semantic effects, and stale-confirmation protection from the more extensible design without adopting catalogs, pagination, or speculative status machinery.

## Decision rounds

### Round 1 — Language and depth

- **Q1 — Canonical terms:** Use Recurring Rule, Occurrence, and Generated Transaction.
- **Q2 — Module depth:** One deep module owns authoring, preservation, scheduling, materialization, progress, and retry. Visual forms remain outside; internal seams remain private.
- **Q3 — Historical behavior:** Generated Transactions are independent snapshots. Rule edits affect only ungenerated Occurrences.
- **Q4 — Materialization:** Due Occurrences materialize automatically.
- **Q5 — Future environment:** Stay local-first now, but design Occurrence identity and Settlement for future multiple writers. Do not add a sync adapter.

### Round 2 — Lifecycle and Settlement

- **Q6 — Overdue edits:** Settle overdue dates using the old Rule; apply edits prospectively.
- **Q7 — Pause:** Dates in a paused interval are skipped permanently, not deferred.
- **Q8 — Deletion:** Archive Rules, preserve lineage, and allow restoration.
- **Q9 — Catch-up:** Settle every missed date from eligible active intervals.
- **Q10 — Runtime triggers:** Run after database readiness on launch and on every foreground transition, with one in-flight run.
- **Q11 — Settlement failure:** Do not block the app; make failure visible and retryable.
- **Q12 — Atomicity:** Settle atomically per Rule while allowing unrelated Rules to continue.
- **Q13 — Identity:** A Rule has at most one Occurrence per scheduled date, identified by `(ruleId, scheduledDate)`.

### Round 3 — Calendar and historical ownership

- **Q14 — Time zone:** A Rule captures the time zone in which its calendar is evaluated.
- **Q15 — Edit transaction:** Old-state Settlement and the prospective edit commit atomically; neither commits if either fails. Do not add revision history.
- **Q16 — Cadence anchor:** Preserve the explicit start anchor during cadence edits unless the start date itself changes.
- **Q17 — Transaction deletion:** Deleting a Generated Transaction does not reopen its Occurrence.
- **Q18 — End count:** Count Settled Occurrences, not paused or skipped cadence slots.
- **Q19 — Natural exhaustion:** Use a distinct Completed lifecycle rather than Archived.
- **Q20 — Missing finance data:** Put the Rule in Needs Attention and stop Settlement until repair.
- **Q21 — Concurrent Settlement:** Coalesce in-process requests and rely on storage uniqueness for future multiple writers.

### Round 4 — User actions and durable Occurrences

- **Q22 — Past-dated creation:** Preview count and total and require confirmation.
- **Q23 — Same-day actions:** Settle today under the old state before edit, pause, or archive takes effect.
- **Q24 — Needs-Attention backlog:** Active Rules continue accruing due dates and catch up after repair.
- **Q25 — Archive restoration:** Restore prospectively and skip the archived interval.
- **Q26 — Completion extension:** Continue at the first anchored date after extension without backfilling the completed gap.
- **Q27 — Occurrence persistence:** Store durable first-class Occurrence records.
- **Q28 — Initial state model:** Use one mutually exclusive state instead of boolean flags or event sourcing. This was superseded by Q69 when health proved orthogonal to lifecycle.
- **Q29 — Generated Transaction mutation:** Allow edits and deletion, preserve visible source lineage, and never mutate the Rule from those changes.
- **Q30 — Required relationships:** Source Account and transfer destination are required; category is optional.

### Round 5 — Persistence authority and dependency changes

- **Q31 — Future dates:** Derive future Occurrences and persist them only during Settlement.
- **Q32 — Time-zone edits:** Allow explicit prospective changes after today settles in the old time zone.
- **Q33 — Account deletion:** Archive affected Rules, detach the deleted Account, and list affected Rules in the confirmation.
- **Q34 — Hard deletion:** Expose no ordinary hard-delete interface. Full app-data reset is the only purge path.
- **Q35 — Account currency changes:** Require explicit amount/currency repair before future Settlement.
- **Q36 — Repair values:** Preview and settle accrued backlog using the repaired values as a deliberate exception to old-term ownership.
- **Q37 — Visibility:** Show a nonblocking global Settlement summary and per-Rule status.

### Round 6 — Module shape and testing

- **Q38 — Name:** Call it the Recurring Rules module.
- **Q39 — Change interface:** Accept domain intents rather than CRUD or generic partial payloads.
- **Q40 — Ownership:** The module owns reads and writes; React Query hooks are thin adapters.
- **Q41 — Persistence seam:** Inject the concrete database and test through in-memory SQLite; do not expose public repositories or persistence ports.
- **Q42 — Nondeterminism:** Inject clock and identity implementations at module construction.
- **Q43 — Caller updates:** Return semantic outcomes and effects; React adapters own cache invalidation.
- **Q44 — Error typing:** Return discriminated expected outcomes and throw unexpected storage failures.
- **Q45 — Test surface:** Test the module interface with in-memory SQLite, retain direct calendar tests, and remove replaced mocked-builder tests.
- **Q46 — Migration breadth:** Migrate the complete recurring path and delete the replaced processor, mapper, hooks, and tests without compatibility modules or flags.
- **Q47 — Locality:** Keep a cohesive `modules/recurring-rules/` directory with a small public entry and private implementation.

### Round 7 — Interface selection and persistence mechanics

- **Q48 — Interface family:** Select the minimal three-entry core with caller-friendly React adapters.
- **Q49 — Reads:** Initially expose list, detail, and upcoming projections with embedded status; defer public Occurrence history.
- **Q50 — Concurrency:** Give each Rule an integer revision and require `expectedRevision` for changes.
- **Q51 — Confirmation tokens:** Use short-lived, single-use in-memory tokens bound to intent, revision, local date, and dependency state.
- **Q52 — Effects:** Return semantic effects for rules, upcoming projections, ledger, balances, and summaries.
- **Q53 — Unexpected Rule failure:** Complete independent Rules, then throw an aggregate error with the partial report and causes.
- **Q54 — Transaction linkage:** Give each Occurrence a nullable Generated Transaction reference with `ON DELETE SET NULL`.
- **Q55 — Progress authority:** Replace `lastGeneratedDate` with durable Occurrences and a prospective Eligibility Floor.
- **Q56 — Money:** Use integer minor units plus ISO currency.
- **Q57 — Missing calendar date:** Clamp to the period's final valid calendar date.

### Round 8 — Legacy interpretation and delivery scope

- **Q58 — Cadence scope:** Preserve daily, weekly, monthly, and yearly intervals with one date per interval.
- **Q59 — Inactive migration:** Map exhausted rows to Completed and other inactive rows to Paused.
- **Q60 — Legacy time zone:** Capture the device's current IANA time zone once for each migrated Rule.
- **Q61 — Legacy precision:** Mark non-convertible amounts Needs Attention and retain their original value for repair rather than rounding.
- **Q62 — Account deletion seam:** Use a narrow application transaction coordinator with private Account and Recurring Rules operations in one SQLite transaction.
- **Q63 — Delivery:** Build an essential vertical slice including schema, module, migrated callers, lifecycle actions, confirmations, and visible statuses; defer rich history browsing.
- **Q64 — Status duration:** Keep successful run summaries transient and unresolved problems visible until resolved.

### Round 9 — Migration, state correction, and UI locality

- **Q65 — Occurrence reconstruction:** Reconstruct every scheduled date through `lastGeneratedDate` and link only unambiguous Rule-local transaction matches.
- **Q66 — Ambiguous transactions:** Preserve duplicates and unmatched transactions, attach at most one to an Occurrence, and retain legacy Rule lineage.
- **Q67 — Migration transaction:** Run one versioned, validated SQLite transaction and roll back completely on failure.
- **Q68 — First Settlement:** Run normal automatic catch-up after migration while blocking Needs-Attention Rules.
- **Q69 — Lifecycle versus health:** Replace Q28's single dimension with independent discriminated lifecycle and health values, still avoiding boolean flags.
- **Q70 — Archived access:** Exclude Archived Rules from the default list and expose an explicit Archived filter with restoration.
- **Q71 — Authoring locality:** Keep the shared `TransactionForm` and add lifecycle and status behavior around the existing Rule detail route. The 2026-08-17 consolidation amendment supersedes the separate-route portion of this decision while preserving the shared-form intent.
- **Q72 — Confirmation breadth:** Preview every user action that would first materialize overdue Occurrences; keep background Settlement automatic.

### Round 10 — Final semantic frontier

- **Q73 — Bounds:** Treat start and end dates as inclusive; the start date is the first anchor.
- **Q74 — Invalid authoring:** Reject internally invalid new or edited Rules with field-level outcomes. Reserve Needs Attention for later degradation and migration.
- **Q75 — Deleted Account result:** Archive, detach, and mark affected Rules Needs Attention.
- **Q76 — Failure durability:** Persist per-Rule failure information when possible and always retain the current aggregate run error in memory.
- **Q77 — Product language:** Use “Recurring” and “Recurring Rule,” not “Recurring Payment.”
- **Q78 — Global feedback:** Use a dismissible root banner that links unresolved items to the filtered Recurring list.

## Rejected patterns

- A broad named-method core interface.
- A speculative catalog, pagination, and status framework.
- Live projections where historical transactions change with their Rule.
- `lastGeneratedDate` as the scheduling authority.
- Persisting all future Occurrences.
- Boolean state flags.
- Event sourcing or revision history in the first delivery.
- Silent amount rounding during migration.
- Database triggers for Account lifecycle behavior.
- Separate non-atomic Account deletion and Rule archival.
- A compatibility layer retaining both recurring implementations.
- Ordinary hard deletion of Rules or Occurrences.
- User-facing language that assumes every Rule is a payment.

## Result

The process produced a deep module with a small interface, explicit calendar and lifecycle semantics, durable Settlement identity, lossless migration behavior, and a complete first vertical slice. The normative implementation contract lives in the linked architecture document.
