# Scope ledgers to a User or an Organization

## Status

Accepted

## Context

ADR 0025 made personal cloud identity work without a Household: a User can sign in with `organizationId: null` and the API authenticates them. But nothing downstream of authentication could hold their data. Accounts, Categories, and Transactions were keyed by `household_id NOT NULL`, `commands.apply` refused any envelope without a `householdId`, and every sync stream took a Household parameter. The only route to cloud storage was Enable Sync, which creates a Household and uploads the device's rows.

That leaves a signed-in User with two bad options: create a single-member Household they did not ask for, or stay local-only. It also forces the Household concept into places that do not need it — a personal ledger has no Members, no invitations, and no Owner distinct from its User.

Households are themselves moving onto WorkOS Organizations (#228). Adding a second identifier column for personal data now would mean unwinding it then.

## Decision

1. A **Ledger** row makes an owner addressable. It is either `kind = 'personal'` (owned by one User) or `kind = 'organization'` (owned by a WorkOS Organization). Ledger ids are `personal:<workos-user-id>` and, for organizations, the organization's own id.
2. Every Account, Category, Transaction, change-log row, command result, and sequence carries `ledger_id NOT NULL`. `household_id` stays on the ledger tables but becomes nullable, non-null only while the row belongs to an organization Ledger.
3. Until #228, an organization Ledger's id **is** the Household id, and a database trigger mirrors each Household into an organization Ledger. This keeps Household-keyed reads working unchanged while `ledger_id` becomes the real key.
4. Commands carry a **scope** — `{ type: 'personal' }` or `{ type: 'organization', organizationId }` — and the API resolves it to a Ledger id before authorizing. Personal scope carries no identifier: it resolves against the Authentication Session's subject, so a client cannot name a Ledger it does not own. An envelope with only `householdId` is read as organization scope for that Household.
5. Authorization differs by scope. Organization scope keeps the Membership check. Personal scope requires only a session, and provisions the User's Ledger on first write.
6. Rows never cross Ledgers. An Account and the Category a Transaction books against must resolve within the same Ledger, enforced by Ledger-keyed composite foreign keys rather than by handler code alone.
7. Household-only Commands — Membership, budgeting, recurring, and import — opt in to personal scope explicitly and currently do not. Under a personal Ledger the mobile app falls back to its on-device budgeting and recurring modules rather than writing rows no stream would return.
8. Turning on personal sync creates no Household and uploads nothing. The cloud Ledger starts empty and the device's local rows are left untouched, so it is an explicit per-device opt-in rather than an automatic consequence of signing in.

## Consequences

- ADR 0025's "personal cloud identity without creating a Household" becomes reachable end to end rather than only at the authentication boundary.
- ADR 0023's separation of an independent local ledger from a server-authoritative synced cache is unchanged; a personal Ledger is the latter.
- Integer money, `commandId` idempotency, and one-batch atomicity are unchanged. Idempotency and change sequences are now keyed by Ledger, so the same `commandId` in two Ledgers is two Commands.
- Two pieces of scaffolding are deliberately temporary. **#228 owns both**: the Household-to-Ledger mirror trigger, which disappears when Households become WorkOS Organizations and write their own Ledger rows; and the nullable `household_id` dual-write on ledger tables, which disappears once reads move fully onto `ledger_id`.
- **#227 owns** extending envelopes, assignments, and recurring rules to personal scope. Until then those tables stay Household-keyed and their handlers reject personal scope.
