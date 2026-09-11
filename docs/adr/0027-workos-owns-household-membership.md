# WorkOS owns Household Membership; Trove projects access

## Status

Accepted

## Context

ADR 0025 replaced Better Auth with WorkOS AuthKit. ADR 0026 made Personal Ledgers real without a Household. Household administration still used Trove-owned invite codes, an Owner role, and a `member.role.change` Command. That kept a second Membership authority beside WorkOS.

#228 makes Households WorkOS Organizations and Membership a derived projection.

## Decision

1. Creating a Household is an explicit API action that creates one WorkOS Organization and an admin Membership. Client `requestId` plus WorkOS idempotency keys make retries converge on one Organization. Sign-in and personal sync never create Households.
2. Local `household.id` is the WorkOS organization id and the organization Ledger id. The Household-to-Ledger mirror trigger from ADR 0026 is removed; create writes the Ledger row directly.
3. Membership rows are a projection of WorkOS organization memberships. Writers are verified webhooks, bootstrap list reads, and mutation responses. Ordering is by `observed_at` (with same-event replay). Inactive tombstones prevent stale creates from resurrecting access.
4. Roles are WorkOS slugs `admin` | `member` | `viewer`. Custom Invite Codes, Owner transfer, and `member.role.change` are removed from the active path. Invitations are WorkOS invitations accepted through AuthKit.
5. Admins open the WorkOS User Management widget on a narrow authenticated web page via a single-use handoff code in the URL fragment. Widget tokens are minted server-side and never placed in URLs. Members and viewers cannot obtain tokens.
6. Client ledger selection (Personal vs a Household) is local and separate from Membership status. Selecting a Household still validates an active known-role Membership before treating it as active.
7. Trove keeps an app-owned sole-admin User-deletion guard. The WorkOS widget does not establish a last-admin invariant; post-mutation webhooks are not prevention.

## Consequences

- Capability checks and Sync Streams deny inactive or unknown roles.
- PowerSync token issuance reconciles a stale Membership bootstrap before extending access; worst-case online revocation is documented in `docs/architecture/membership-revocation.md`.
- Full User deletion and Better Auth table removal remain later #224 children; the sole-admin guard must ship with deletion.
