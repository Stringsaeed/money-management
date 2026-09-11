# Money Management

The money-management context records financial activity and the rules that create future ledger entries.

## Language

### Identity & Households

**User**:
An authenticated person identified by a WorkOS User id and an email address. A User may use the app anonymously with purely local data; signing in unlocks cloud features but never moves the ledger off the device by itself, and signing out ends only the remote session unless the User separately confirms local-data erasure. It is distinct from a Member, which is a User's participation in one Household.
_Avoid_: Account (see Account below), Profile

**Authentication Session**:
The revocable WorkOS AuthKit session that proves a User's identity for cloud features. Access tokens are bearer JWTs verified by the API; refresh credentials stay on the device. The session persists until explicit sign-out or server revocation and is independent of the device-local ledger, so ending it never erases local financial data by itself.
_Avoid_: Local Account, Ledger Session

**Email Code**:
A one-time code delivered by WorkOS AuthKit to an email address that proves control of that address for sign-in or sign-up. Hosted AuthKit owns issuance and verification; Trove does not send password or magic-link credentials.
_Avoid_: Invite Code, Password Reset Session, Email Link (superseded)

**WorkOS Organization**:
The WorkOS tenant that backs one Household. Personal authentication and personal ledgers do not require an organization. Creating or joining a Household is an explicit later action, never an automatic side effect of sign-in.
_Avoid_: Hidden personal organization

**Household**:
A shared money-management workspace that multiple Users join to see household-owned data together. The Household is the unit of membership and invitation — not a container for device-local ledger data. Financial records remain local-first until a future sharing milestone claims them.
_Avoid_: Family, Workspace, Group

**Ledger Scope**:
Who owns one body of cloud financial records: either a single User (personal) or a WorkOS Organization (organization). Scope is what a client declares on a Command and what the API resolves before authorizing it; a client-supplied scope is a request, never proof. Personal scope carries no identifier on the wire because the Authentication Session already names the User.
_Avoid_: Tenant, Container, Namespace

**Ledger**:
The row that makes a Ledger Scope addressable, identified by a Ledger id: `personal:<workos-user-id>` for personal scope, and the Household id for organization scope until Households migrate onto WorkOS Organizations. Every Account, Category, and Transaction belongs to exactly one Ledger, and nothing crosses between two — an Account and the Category it is booked against must share a Ledger. A personal Ledger exists from its owner's first write; it has no Members, no invitations, and no Owner other than the User themselves.
_Avoid_: Book, Tenant, Workspace

**Membership**:
The association of one User with one Household carrying a role and an active flag. A User holds at most one active Membership at a time; the active one is the Household the app currently addresses. Memberships support multiple Households per User even though only one is active. WorkOS is the source of truth for organization Memberships once Household administration migrates.
_Avoid_: Account Link, Subscription

**Household admin**:
A Member with the WorkOS `admin` role for a Household Organization. Admins invite and remove Members, open the WorkOS member-management widget, rename the Household, and request Household deletion. Sole-admin guards block deletion when another active admin would be stranded.
_Avoid_: Owner (legacy), Creator

**WorkOS invitation**:
An email invitation issued through WorkOS that admits one User into a Household Organization. Acceptance happens in hosted AuthKit; Trove does not generate custom invite codes.
_Avoid_: Invite Code (retired), Invite Link, Password

> **Naming note**: "Account" in this context always means a _financial_ Account (see Cash Account, Archived Account). The `user` table stores WorkOS-linked identity; Better Auth session tables were removed in #231.

**Command**:
The unit of a client write to the backend: a domain intent (e.g. `member.role.change`, `transaction.create`) — not a row diff — carrying a client-generated `commandId` that doubles as its idempotency key. Applied optimistically to the PowerSync collection, stored with its full envelope in the PowerSync upload queue, and processed exactly once server-side regardless of retry count. Wire shape lives in `packages/protocol`.
_Avoid_: Mutation Payload, CRUD Request

**Rejected Changes Inbox**:
The client-side list of Commands the server refused with a typed rejection reason (for example `stale_version` or `invalid_intent`). A rejected Command is never silently dropped or silently merged; the user re-edits or discards it from here. Backed by PowerSync's `rejected_changes` local-only table, never synced.
_Avoid_: Failed Syncs, Dead Letter Queue

**Household Change**:
One row appended per committed Command in `household_changes`, carrying a per-Ledger monotonic sequence number (`seq`), the acting user, the command's `commandId`, and the `effects[]` tags it invalidated. It is a Ledger's activity history and the source of the `seq` returned by `commands.apply`; PowerSync streams the authoritative ledger rows directly. Idempotency is keyed by Ledger too, so the same `commandId` in two Ledgers is two Commands.
_Avoid_: Audit Log Entry

**Effect Tag**:
A token from a fixed vocabulary (`rules | upcoming | ledger | balances | summaries | envelopes | assignments | projections | members`) naming what a committed Command invalidated. Clients map tags onto their local cache-invalidation matrix; the API maps them onto projection recomputation. Defined in `packages/protocol`.
_Avoid_: Change Type, Event Type

**Sync Stream**:
A PowerSync query that selects the authoritative rows a signed-in client may retain. `memberships` and `personal_ledger` auto-subscribe by JWT subject, the latter resolving the caller's own Ledger rather than taking one as a parameter; `household_ledger`, `household_budget`, and `household_recurring` are subscribed with a Household parameter and independently prove membership before streaming ledger, envelope, and recurring facts.
_Avoid_: Delta, Poll Feed

**PowerSync Checkpoint**:
The service-managed position proving which source-database changes have reached the device. Application code does not persist or send a custom Watermark; collection readiness waits for the relevant Sync Stream's first checkpoint.
_Avoid_: Watermark, Cursor, Offset

### Recurring Rules

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

**Settlement Sweep**:
The hourly server-side pass that settles every active Recurring Rule of every ledger (personal and organization), evaluating each Rule on its own time zone's local date. Idempotent under Cron Trigger retries; manual runs go through an admin-guarded procedure.
_Avoid_: Cron Job, Sync Job

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

### Envelope Budgeting

**Envelope**:
A persistent, single-currency planning container for Money assigned from available cash to a purpose. An active Envelope has at least one active expense Category; it may cover multiple Categories, but each Category belongs to at most one Envelope. It does not hold an Account balance, classify Transactions, or represent physical cash.
_Avoid_: Cash Account, Category, Spending Limit

**Category Mapping**:
The Budget-Period-aware association that attributes a Category's expense Transactions to one Envelope. A changed mapping applies to the current and future periods while earlier periods retain their mapping unless the user explicitly backfills them.
_Avoid_: Category Assignment, Transaction Envelope

**Cash Account**:
An Account whose balance represents physical cash held in a wallet or another real-world location. It is distinct from a budgeting Envelope.
_Avoid_: Envelope

**Archived Account**:
A zero-balance Account retained with its Transactions and dependent history but unavailable for new activity or Funding Pool membership. Related Budget Shortfalls, Card Payment Reserves, and Unfunded Card Spending must be resolved before archival; restoration does not automatically restore Funding Membership. Only an Account without Transactions or dependent history may be permanently deleted.
_Avoid_: Deleted Account, Closed Balance

**Funding Account**:
An Account selected by the user whose balance contributes Money to the funding pool for its currency. Checking, savings, and Cash Accounts are included by default; credit-card and investment Accounts are excluded by default.
_Avoid_: Envelope Account, Budget Account

**Funding Membership**:
The Budget-Period-aware inclusion of an Account in its currency's Funding Pool. A changed membership applies to the current and future periods while earlier periods retain their membership unless explicitly backfilled; it is independent of whether the Account appears in Home totals.
_Avoid_: Total-Balance Inclusion, Account Visibility

**Funding Pool**:
The sum of the current computed balances of Funding Accounts that share one currency, including initial balances and posted Transactions. Negative Funding Account balances reduce their Funding Pool; Funding Pools of different currencies remain independent.
_Avoid_: Converted Balance, Global Budget Balance

**Period Opening Funding Pool**:
The reconstructed Funding Pool at the beginning of a Budget Period. Current-period activity is reversed from current Account balances and then replayed exactly once, including when budgeting begins or Funding Membership changes during that period.
_Avoid_: Activation Balance, Today's Starting Balance

**Unassigned Money**:
Money contributed by a currency's Funding sources that is not assigned to an Envelope in any current or future Budget Period. A budget may retain Unassigned Money without becoming invalid, but an Assignment cannot consume more Unassigned Money than exists.
_Avoid_: Unbudgeted Balance, Leftover Cash

**Assignable Income**:
An income Transaction posted to a Funding Account and added to Unassigned Money in that Account's currency. Expected income and future Occurrences are not Assignable Income until they materialize as Transactions.
_Avoid_: Expected Income, Planned Income

**Funding Boundary Transfer**:
A same-currency Account transfer that enters or leaves a Funding Pool. Transfers within one Funding Pool are budget-neutral; Money entering becomes Unassigned Money, while Money leaving consumes Unassigned Money or creates a Budget Shortfall. Card Payments retain their separate reserve behavior.
_Avoid_: Income, Expense, Assignment

**Assignment**:
An append-only, auditable budget-only movement of Money between Unassigned Money and an Envelope or between Envelopes. It first covers cash Envelope Overspending, then the oldest Unfunded Card Spending, and only then creates new availability; it does not change Account balances or create a Transaction, and corrections use a reversing Assignment followed by its replacement.
_Avoid_: Transfer, Transaction

**Future Assignment**:
An Assignment of currently owned Unassigned Money to an Envelope in a future Budget Period. It reserves that Money immediately, never relies on expected income, and is unavailable while the currency workspace has cash Envelope Overspending or Unfunded Card Spending.
_Avoid_: Planned Income, Forecast Assignment

**Budget Period**:
One live, recomputable calendar month of an Envelope's Assignments, spending, and Rollover. Envelopes persist across Budget Periods, and a new period begins without requiring the previous one to be closed.
_Avoid_: Envelope Cycle, Budget Instance

**Ledger Date**:
The stored calendar date of a Transaction, which determines its Budget Period without timezone conversion. Device-local time determines the current date, but travelling or changing timezone never moves an existing Transaction between periods.
_Avoid_: Creation Time, Settlement Time

**Archived Envelope**:
An Envelope retained with its Assignments, Category Mappings, spending, and Rollover history but unavailable for new planning activity. Its availability, overspending, Card Payment Reserve, and active Category Mappings must be resolved before archival; restoration requires valid Category Mappings before it becomes active again.
_Avoid_: Deleted Envelope, Closed Envelope

**Archived Category**:
A Category retained with its Transactions and Category Mapping history but unavailable for new Transaction entry. Its current-period mapping remains for existing activity and ends for future periods; restoration does not recreate future mappings. Only a Category without Transactions or mapping history may be permanently deleted.
_Avoid_: Deleted Category, Hidden Category

**Envelope Spending**:
Posted expense Transactions attributed to an Envelope through their Category. Generated Transactions count after Settlement, while future Occurrences do not reserve Money.
_Avoid_: Planned Spending, Recurring Reservation

**Assigned Money**:
The net Money explicitly assigned to an Envelope for one Budget Period, excluding Rollover and Projected Rollover.
_Avoid_: Available Money, Envelope Balance

**Net Spent**:
Envelope Spending minus Refunds posted during the same Budget Period. Gross expenses and Refunds remain separately visible in the Envelope's activity history.
_Avoid_: Gross Spending, Historical Rewrite

**Available Money**:
The Money an Envelope can still support after Rollover, Assignments, Net Spent, and card-reserve routing. Cash Envelope Overspending may make it negative, while credit spending stops it at zero and continues as Unfunded Card Spending.
_Avoid_: Assigned Money, Account Balance

**Unassigned Spending**:
Posted expense Transactions within the budget's Account scope that cannot be attributed to an Envelope. Unassigned Spending reduces Unassigned Money and remains flagged until the user resolves its Category or Envelope mapping.
_Avoid_: Ignored Spending, Miscellaneous Envelope

**Budget Shortfall**:
Negative Unassigned Money indicating that assigned or reserved Money exceeds the Funding Pool. A Budget Shortfall remains visible until the user changes the plan or the Funding Pool increases.
_Avoid_: Overspent Envelope, Negative Balance

**Card Payment Reserve**:
System-managed Money reserved from an Envelope when its Category attributes a credit-card purchase. Paying that credit card consumes its same-currency reserve rather than creating new available Money.
_Avoid_: Credit Envelope, Card Account Balance

**Card Credit**:
A positive credit-card balance representing Money the card issuer owes the user. It is a temporary same-currency funding source that increases Unassigned Money; spending consumes Card Credit before creating a Card Payment Reserve or Unfunded Card Spending.
_Avoid_: Card Payment Reserve, Available Credit

**Card Payment**:
A same-currency transfer from a Funding Account to a credit-card Account. It consumes the Card Payment Reserve, then funded Opening Card Debt, then Unassigned Money against unfunded debt; any amount beyond the total debt becomes Card Credit, while an unpaid reserve remains reserved.
_Avoid_: Expense, Reserve Adjustment

**Unfunded Card Spending**:
The portion of a credit-card purchase that exceeds its Envelope's available Money and therefore has no cash in the Card Payment Reserve. Credit spending stops Envelope availability at zero and carries this amount separately; later Assignments route Money into the reserve until it is funded.
_Avoid_: Card Payment Reserve, Budget Shortfall

**Opening Card Debt**:
A credit-card liability that predates the budget and therefore is not Envelope Spending. The user may assign Unassigned Money directly to its Card Payment Reserve without creating backdated expense Transactions.
_Avoid_: Starting Expense, Unfunded Card Spending

**Envelope Overspending**:
Negative availability in an Envelope after cash Envelope Spending exceeds the Money assigned to it. It remains visible until the user explicitly assigns or moves Money to cover it and otherwise rolls into the next Budget Period; credit overspending is tracked separately as Unfunded Card Spending.
_Avoid_: Budget Shortfall, Automatic Coverage

**Envelope Health**:
The independently discriminated readiness of an Envelope: Ready or Needs Attention. Cash Envelope Overspending and Unfunded Card Spending require attention; health does not replace the Envelope's active or archived lifecycle.
_Avoid_: Envelope Status, Warning Color

**Budget Health**:
The independently discriminated readiness of one currency workspace: Ready or Needs Attention. Budget Shortfalls and Unsupported Currency Transfers require workspace-level attention rather than being attributed to one Envelope.
_Avoid_: Envelope Health, Currency Status

**Home Currency**:
The user-selected currency workspace summarized on Home and preferred by future reporting. If it is unset, the first Funding Pool is used; it never authorizes combining or converting Funding Pools.
_Avoid_: Reporting Conversion, Largest Currency

**Rollover**:
The Money carried from one Budget Period into the next. Positive availability rolls forward by default but may return to Unassigned Money for an Envelope configured to start fresh; cash overspending always carries forward. A changed Rollover setting applies to the current and future periods while earlier periods retain their setting.
_Avoid_: Balance Reset, Period Copy

**Projected Rollover**:
The live estimate of Money a future Budget Period will receive from all preceding periods. It is displayed separately from explicit Future Assignments and recalculates whenever an earlier period changes.
_Avoid_: Committed Rollover, Future Assignment

**Historical Adjustment**:
A visible change to a Budget Period and its later Rollovers caused by correcting or deleting a past Transaction. Historical Adjustments keep the budget reconciled with the current ledger rather than preserving a known inaccuracy.
_Avoid_: Current-Period Correction, Locked History

**Refund**:
A full or partial return of Money linked to its original expense Transaction. Multiple same-currency Refunds may link to one expense but cannot cumulatively exceed it; card Refunds return to the original card, while cash-account Refunds may enter any same-currency Funding Account. A Refund affects its own Budget Period, restores the original Envelope, and adjusts its Card Payment Reserve; if that Envelope is archived, attribution is preserved while the returned Money becomes Unassigned Money.
_Avoid_: Income, Transaction Deletion

**Budget Reset**:
The confirmed removal of Envelopes, Category Mappings, Assignments, Funding Memberships, Rollover settings, and Setup Drafts while retaining Accounts, Categories, Transactions, and Refund relationships. It is distinct from a full data reset.
_Avoid_: Full Data Reset, Archive All

**Setup Draft**:
An incomplete, locally retained envelope-setup proposal with no effect on Funding Pools, Category Mappings, or Assignments until the user confirms it. The user may resume or discard it.
_Avoid_: Active Budget, Partial Activation

**Budget Workspace**:
The per-currency budgeting context of one Household: the container whose Envelopes, Funding Pool, Assignments, and projections all share a single currency. Cross-currency transfers between Workspaces are unsupported rather than converted. Server-side it is the `budget_workspaces` root every budget fact references.
_Avoid_: Currency Group, Budget Book

**Period-Effective Row**:
An INSERT-only row (`category_mappings`, `funding_memberships`, `rollover_settings`) that takes effect from its Budget Period onward and ends when a later row for the same entity appears — `effective_to_period` is always derived via LEAD, never stored. Ending a row early is done by appending a tombstone (an unmapped mapping or an inactive membership), not by editing.
_Avoid_: Dated Record, Effective-Dated Entry

**Outside-Budget Spending**:
Expense Transactions from Accounts outside the Funding Pool and outside the credit-card reserve model. They remain visible in reports but do not affect Envelopes or Unassigned Money.
_Avoid_: Unassigned Spending, Envelope Spending

**Unsupported Currency Transfer**:
A legacy Account transfer whose source and destination currencies differ but whose record contains only one amount. It is excluded from Funding Pool calculations and marked Needs Attention until replaced with exact same-currency records or a future conversion flow.
_Avoid_: Currency Conversion, Estimated Transfer
