# WorkOS management widget contract (#225)

## Purpose

Bounded feasibility record for hosting the WorkOS User Management widget from Trove. Full Household administration UI lands in later tickets.

## Integration contract

| Concern         | Contract                                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Who may open it | WorkOS organization `admin` only. Members and viewers are denied before a token is minted (`decideWidgetToken`).        |
| Credentials     | Server mints a short-lived widget token with `WORKOS_API_KEY`. Never put API keys or refresh tokens in URLs.            |
| Identity        | Widget page validates the intended WorkOS User id and organization id against the authenticated session.                |
| Return path     | Mobile/browser return uses the app scheme / https handoff without reusable secrets in the query string.                 |
| User deletion   | App-owned guard required: sole Household admin must appoint another admin or delete the Household before User deletion. |

## Observed safeguard limitations

1. Official WorkOS docs do not establish that the widget prevents the final admin from removing or demoting themselves in a customer organization.
2. Dashboard team safeguards are not the same as customer-organization widget behavior.
3. A webhook after the fact cannot prevent a mutation that already succeeded. Post-event repair is not prevention.
4. Sole-admin / sole-member User deletion assumptions must be enforced by Trove, not assumed from the widget.

## Disposable demo prerequisites

- WorkOS environment with AuthKit email codes enabled; password/social disabled
- Redirect URI `trove://callback` registered
- `EXPO_PUBLIC_WORKOS_CLIENT_ID`, `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`
- JWT template that sets `aud` only when using a custom `WORKOS_TOKEN_AUDIENCE`; default AuthKit session tokens bind via `client_id` instead of `aud`
- `WORKOS_TOKEN_ISSUER` matching issued tokens (default `https://api.workos.com`)
- Disposable organization plus admin / member / viewer Users for role checks

## Code path

- Token gate: `packages/auth/src/widget-contract.ts` (`decideWidgetToken`)
- Findings constant: `WIDGET_SAFEGUARD_FINDINGS`
- Auth session claims: `packages/auth/src/session.ts`
- Handoff + page: `packages/api/src/lib/households/widget-handoff.ts`, `packages/auth/src/member-widget-page.ts`, `apps/server/src/member-widget.ts`
- Sole-admin User-deletion guard: `packages/api/src/lib/households/sole-admin-deletion-guard.ts`
- Revocation bound: `docs/architecture/membership-revocation.md`
