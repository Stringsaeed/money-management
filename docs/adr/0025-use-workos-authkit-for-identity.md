# Use WorkOS AuthKit for identity; keep anonymous local use

## Status

Accepted (supersedes Better Auth / password / email-link decisions in ADR 0024)

## Context

Trove is still in development and is replacing Better Auth plus custom Household administration with WorkOS (#224). Authentication must support:

- Anonymous local-only use with a device ledger
- Hosted email-code sign-in on iOS and Android development builds
- Personal cloud identity without creating a Household or organization
- Bearer access tokens at the API boundary instead of Better Auth cookies

## Decision

1. WorkOS AuthKit is the only active identity provider. Better Auth is removed from the active mobile and API path.
2. Hosted AuthKit uses email codes with PKCE, validated callback `state`, cancellation, and return-to-context. Password and social methods stay disabled in the WorkOS dashboard for this app.
3. Mobile stores access and refresh tokens in SecureStore, serializes refresh-token rotation, and recovers the session after restart. Transient refresh failures keep local access; terminal failures clear credentials.
4. The API authenticates via `Authorization: Bearer` and verifies signature, issuer, expiry, and configured audience against WorkOS JWKS. Client-supplied User or organization identifiers are never proof of access.
5. Canonical identity keys are the WorkOS User id (`sub`) and optional `org_id`. Personal authentication works with `organizationId: null`.
6. Signing in creates neither a Household nor an automatic upload of local records.
7. The WorkOS User Management widget is feasible as a narrow admin-only web surface. Trove keeps an app-owned sole-admin User-deletion guard. Post-event webhooks are not prevention.

## Consequences

- ADR 0024's Better Auth, password fallback, magic/reset email-link, and cookie-session product details are superseded for the active path.
- ADR 0024's optional anonymous local-first stance and Settings return-to-context remain.
- ADR 0023's distinction between an independent local ledger and a server-authoritative synced cache remains.
- Full Household administration, personal sync streams, and Better Auth table deletion land in later #224 children.
