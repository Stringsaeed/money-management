-- Custom access token hook (Phase 0, Auth).
--
-- Spec: docs/architecture/backend-architecture.md ("Managed state: Supabase"):
-- a Postgres function — not an Edge Function — stamps household/role claims
-- into every issued JWT. apps/api later verifies these JWTs against Supabase's
-- JWKS endpoint; the claims are a latency filter only, never the authority —
-- live membership is re-checked per command.
--
-- Claims added to the `claims` object:
--   household_roles     { "<household_id>": "<role>", ... } for active memberships
--   active_household_id uuid of the most recently joined active membership, if any

create function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_claims jsonb;
  v_roles jsonb;
  v_active_household_id uuid;
begin
  v_user_id := coalesce(
    nullif(event ->> 'user_id', ''),
    nullif(event -> 'claims' ->> 'sub', '')
  )::uuid;

  if v_user_id is null then
    return event;
  end if;

  select jsonb_object_agg(m.household_id::text, m.role::text),
         (array_agg(m.household_id order by m.joined_at desc))[1]
  into v_roles, v_active_household_id
  from public.household_members m
  where m.user_id = v_user_id
    and m.status = 'active';

  v_claims := coalesce(event -> 'claims', '{}'::jsonb);
  -- Fresh values must overwrite stale claim values on token refresh; the
  -- concatenation below lets the recomputed map win over any previous claims.
  v_claims := v_claims || jsonb_build_object(
    'household_roles', coalesce(v_roles, '{}'::jsonb),
    'active_household_id', v_active_household_id
  );

  return jsonb_set(event, '{claims}', v_claims);
end;
$$;

comment on function public.custom_access_token_hook(jsonb) is
  'Supabase Auth custom access token hook: stamps household/role claims into issued JWTs.';

-- The hook is invoked by supabase_auth_admin only; client roles must not be
-- able to call it directly.
revoke execute on function public.custom_access_token_hook(jsonb)
  from anon, authenticated, public;
grant execute on function public.custom_access_token_hook(jsonb)
  to supabase_auth_admin;
