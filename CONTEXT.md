# Money Management

The money-management context records financial activity and the rules that create future ledger entries.

## Language

**Recurring Rule**:
A durable instruction describing one daily, weekly, monthly, or yearly cadence and the content of future ledger transactions, evaluated in a time zone captured for that Rule. Its start and end dates are inclusive, and its start date is the cadence anchor. Each cadence interval implies at most one Occurrence. When an intended monthly or yearly date does not exist, the Rule uses that period's final valid calendar date. It is distinct from the transactions it creates.
_Avoid_: Recurring Payment, Recurring Transaction, Schedule

**Rule Revision**:
A monotonically increasing integer identifying the version of a Recurring Rule. A change must name the revision it observed so stale intent cannot overwrite newer Rule state.
_Avoid_: Updated Timestamp, Version Date

**Eligibility Floor**:
The earliest local date from which a Recurring Rule may produce Occurrences. It advances after pauses, archives, completion extensions, and other prospective changes so skipped dates do not become a backlog.
_Avoid_: Last Generated Date, Processing Cursor

**Rule Lifecycle**:
The mutually exclusive lifecycle of a Recurring Rule: Active, Paused, Archived, or Completed. Lifecycle is independent of Rule Health and is represented as a discriminated value rather than a collection of flags.
_Avoid_: Active Flag, Deleted Flag

**Rule Health**:
The independently discriminated readiness of a Recurring Rule: Ready or Needs Attention. Health does not replace or conceal the Rule Lifecycle.
_Avoid_: Valid Flag, Error Flag

**Active Rule**:
A Recurring Rule whose lifecycle makes it eligible to produce Occurrences when its scheduled dates become due. Only a Ready Active Rule may settle; a Needs-Attention Active Rule accrues its backlog until repaired.
_Avoid_: Enabled Rule, Running Rule

**Occurrence**:
One scheduled date implied by a Recurring Rule, uniquely identified by the Rule and that scheduled date, whether or not it has been materialized into the ledger.
_Avoid_: Payment Instance, Recurring Transaction

**Settled Occurrence**:
An Occurrence recorded as handled so it cannot produce another Generated Transaction, even if its original Generated Transaction is later edited or deleted.
_Avoid_: Processed Payment, Generated Date

**Generated Transaction**:
A ledger transaction materialized from an Occurrence. Once created, it is an independent historical snapshot rather than a live projection of its Recurring Rule.
_Avoid_: Recurring Payment

**Settlement**:
The act of materializing every due Occurrence of a Recurring Rule into Generated Transactions and recording those Occurrences as handled.
_Avoid_: Processing, Generation

**Money**:
An exact amount represented as integer minor units paired with an ISO currency code.
_Avoid_: Float Amount, Formatted Amount

**Paused Rule**:
A Recurring Rule whose lifecycle temporarily prevents it from producing Occurrences. Scheduled dates during the pause are skipped rather than deferred, regardless of Rule Health.
_Avoid_: Disabled Rule, Inactive Rule

**Archived Rule**:
A Recurring Rule retained for historical lineage whose lifecycle prevents it from producing Occurrences while archived, regardless of Rule Health.
_Avoid_: Deleted Rule

**Completed Rule**:
A Recurring Rule that naturally fulfilled its end date or occurrence count.
_Avoid_: Archived Rule, Inactive Rule

**Needs-Attention Rule**:
A Recurring Rule whose health records that required financial information is missing, invalid, or could not be migrated without changing its meaning. Repair restores Ready health without changing lifecycle.
_Avoid_: Failed Rule, Invalid Rule

**Repair**:
A confirmed change that restores a Needs-Attention Rule to Ready health. Repair may update the Rule and materialize its accrued backlog atomically, but it does not change lifecycle.
_Avoid_: Fix, Reactivate
