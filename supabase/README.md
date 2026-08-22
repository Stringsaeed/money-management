# Supabase — Managed State Layer

Infra-as-code for the Trove backend's Supabase project: Postgres schema,
Auth configuration, Row-Level Security, and the custom access token hook.
**No Edge Functions** — business logic lives in `apps/api` (see
[`docs/architecture/backend-architecture.md`](../docs/architecture/backend-architecture.md)).

## Contents

| Path                                        | Purpose                                                                                                                                                                                                                                                                                 |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `config.toml`                               | Local project config. Auth runs email/OTP sign-in; the custom access token hook is wired to `public.custom_access_token_hook`. Local ports use a **6432x range** so another local Supabase project can own the defaults.                                                                |
| `migrations/*_household_tenancy.sql`        | Tenancy root: `households`, `household_members`, `household_invites`, `household_settings`; role/status enums; capability helpers; atomic RPCs (`create_household_with_owner`, `accept_household_invite`, `revoke_household_invite`, `leave_household`); RLS policies; Data API grants. |
| `migrations/*_custom_access_token_hook.sql` | Postgres function stamping `household_roles` + `active_household_id` claims into every issued JWT.                                                                                                                                                                                      |
| `tests/*.sql`                               | pgTAP suite: schema invariants, cross-household isolation, role capability matrix, invite lifecycle, hook claim stamping.                                                                                                                                                               |

## Design notes

- **Households are the tenancy root.** Every fact table carries `household_id`
  with composite keys; later fact tables (accounts, transactions, envelopes…)
  follow the same conventions.
- **Roles**: `owner > admin > member > viewer`, resolved through
  `is_household_member()` / `has_household_role()` SECURITY DEFINER helpers so
  policy evaluation never recurses into `household_members`' own RLS.
- **Archive, never delete** (ADR-0009): no DELETE policies or grants anywhere;
  removing a member archives their row so authorship attribution survives.
- **Multi-table writes go through RPCs.** The Data API cannot write two tables
  transactionally, so household creation (household + owner membership +
  settings) and invite acceptance/revocation are atomic Postgres functions.
- **Permissive policies OR independently.** Each policy's `WITH CHECK` is
  self-contained — passing one policy's `USING` must never let a row through
  another policy's more lenient check (this was a real bug the pgTAP suite caught).
- **JWT claims are a filter, not the authority.** `apps/api` re-checks live
  membership per command; claims only let it skip work early.
- Attribution columns (`created_by`/`updated_by`) reference `auth.users ON DELETE
SET NULL`: hard-deleting an account (App Store requirement) must never be
  blocked by financial history.

## Local development

```bash
pnpm supabase:start        # boots Postgres + Auth + Studio on 127.0.0.1:64321+
pnpm supabase:test         # runs the pgTAP suite against the local database
pnpm supabase:db:reset     # re-applies all migrations from scratch
```

After changing migrations, always verify with `pnpm supabase:db:reset && pnpm supabase:test`.

## CI

`.github/workflows/supabase.yml` boots the local stack and runs the pgTAP
suite on every pull request.
