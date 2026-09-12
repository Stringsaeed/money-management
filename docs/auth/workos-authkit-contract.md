# WorkOS AuthKit identity + widget contract (#225)

## Identity

| Field            | Source                           | Notes                                                                       |
| ---------------- | -------------------------------- | --------------------------------------------------------------------------- |
| `user.id`        | JWT `sub`                        | WorkOS User id (`user_…`). Canonical for API + PowerSync.                   |
| `user.email`     | JWT `email` (optional)           | May be empty on bare access tokens; mobile keeps profile from authenticate. |
| `user.name`      | JWT `name` or email              | Display only.                                                               |
| `organizationId` | JWT `org_id` / `organization_id` | Optional. `null` for personal auth.                                         |

Personal authentication must succeed without an organization.

## API verification

- Header: `Authorization: Bearer <access_token>`
- JWKS: live `https://api.workos.com/sso/jwks/{WORKOS_CLIENT_ID}` (never hardcode JWKS JSON in production)
- Issuer: `WORKOS_TOKEN_ISSUER` or `https://api.workos.com`, plus slash twins and `https://{WORKOS_AUTH_HOSTNAME}` when set (Alchemy defaults hostname to `auth.trove.ing` so custom AuthKit domains do not fail as `claim_iss`)

- Binding (AuthKit session tokens omit `aud` by default):
  - Default (no `aud`): mismatched `client_id` fails; missing `client_id` is OK because jose already verified against JWKS for `WORKOS_CLIENT_ID`
  - If `aud` is present: require it to match `WORKOS_TOKEN_AUDIENCE` or `WORKOS_CLIENT_ID`
  - Custom `WORKOS_TOKEN_AUDIENCE` (≠ client id) requires a WorkOS JWT template that sets `aud`
  - Deploy Worker always exports `WORKOS_TOKEN_AUDIENCE` (empty unless GH secret set) so sticky custom audiences cannot linger
- Fail closed on missing/forged/expired/wrong-claim tokens

## Mobile AuthKit

- Public: `EXPO_PUBLIC_WORKOS_CLIENT_ID`
- Redirect: `EXPO_PUBLIC_WORKOS_REDIRECT_URI` (default `trove://callback`) — must match WorkOS dashboard + `WORKOS_REDIRECT_URI`
- PKCE authorize → AuthKit email code → token exchange → SecureStore
- Sign-in does not create Households or upload device data

## Personal sync (#226)

A verified session is the whole entitlement to a personal Ledger — see [ADR 0026](../adr/0026-scope-ledgers-to-a-user-or-an-organization.md).

- Ledger id is `personal:<jwt sub>`. Commands declare `scope: { type: "personal" }` and carry no user id, so the claim cannot be forged by sending someone else's.
- No Membership check and no `org_id` requirement; the API provisions the Ledger on first write.
- The local `user` row is projected from verified claims on that first write, since WorkOS owns the User record. Email falls back to `<sub>@users.workos.invalid` when the token carries none.
- PowerSync `personal_ledger` auto-subscribes and resolves the Ledger from `auth.user_id()` rather than a client-supplied parameter.
- Turning it on creates no Household and uploads nothing — the cloud Ledger starts empty.

## Widget (bounded feasibility)

See `WIDGET_SAFEGUARD_FINDINGS` / `decideWidgetToken` in `@trove/auth`.

- Admin-only token minting
- No credentials in URLs
- App-owned sole-admin User-deletion guard remains required
- WorkOS does not document prevention of sole-admin self-removal/demotion for customer orgs

## Env names

Server: `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_WEBHOOK_SECRET`, `WORKOS_TOKEN_ISSUER?`, `WORKOS_TOKEN_AUDIENCE?`, `WORKOS_AUTH_HOSTNAME?`, `WORKOS_REDIRECT_URI?`

Mobile: `EXPO_PUBLIC_WORKOS_CLIENT_ID`, `EXPO_PUBLIC_WORKOS_REDIRECT_URI?`
