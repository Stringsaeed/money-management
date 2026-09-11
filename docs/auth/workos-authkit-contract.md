# WorkOS AuthKit identity + widget contract (#225)

## Identity

| Field            | Source                           | Notes                                                     |
| ---------------- | -------------------------------- | --------------------------------------------------------- |
| `user.id`        | JWT `sub`                        | WorkOS User id (`user_…`). Canonical for API + PowerSync. |
| `user.email`     | JWT `email` (optional)           | May be empty on bare access tokens; mobile keeps profile from authenticate. |
| `user.name`      | JWT `name` or email              | Display only.                                             |
| `organizationId` | JWT `org_id` / `organization_id` | Optional. `null` for personal auth.                       |

Personal authentication must succeed without an organization.

## API verification

- Header: `Authorization: Bearer <access_token>`
- JWKS: live `https://api.workos.com/sso/jwks/{WORKOS_CLIENT_ID}` (never hardcode JWKS JSON in production)
- Issuer: `WORKOS_TOKEN_ISSUER` or `https://api.workos.com`
- Audience: `WORKOS_TOKEN_AUDIENCE` or `WORKOS_CLIENT_ID`
- Fail closed on missing/forged/expired/wrong-claim tokens

## Mobile AuthKit

- Public: `EXPO_PUBLIC_WORKOS_CLIENT_ID`
- Redirect: `EXPO_PUBLIC_WORKOS_REDIRECT_URI` (default `trove://callback`) — must match WorkOS dashboard + `WORKOS_REDIRECT_URI`
- PKCE authorize → AuthKit email code → token exchange → SecureStore
- Sign-in does not create Households or upload device data

## Widget (bounded feasibility)

See `WIDGET_SAFEGUARD_FINDINGS` / `decideWidgetToken` in `@trove/auth`.

- Admin-only token minting
- No credentials in URLs
- App-owned sole-admin User-deletion guard remains required
- WorkOS does not document prevention of sole-admin self-removal/demotion for customer orgs

## Env names

Server: `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_TOKEN_ISSUER?`, `WORKOS_TOKEN_AUDIENCE?`, `WORKOS_REDIRECT_URI?`

Mobile: `EXPO_PUBLIC_WORKOS_CLIENT_ID`, `EXPO_PUBLIC_WORKOS_REDIRECT_URI?`
