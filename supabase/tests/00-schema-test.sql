-- Schema and hardening invariants for the household tenancy foundation.

begin;
select * from no_plan();

-- Tables exist -----------------------------------------------------------

select is(count(*)::int, 4, 'four tenancy tables exist')
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('households', 'household_members', 'household_invites', 'household_settings');

select has_table('households');
select has_table('household_members');
select has_table('household_invites');
select has_table('household_settings');

-- Composite PK on members; single-PK elsewhere ---------------------------

select has_index(
  'public', 'household_members',
  'household_members_pkey',
  'members use the composite (household_id, user_id) primary key'
);

-- RLS enabled AND forced (table owner included) --------------------------

select is(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.households'::regclass),
  true, 'RLS enabled+forced on households'
);
select is(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.household_members'::regclass),
  true, 'RLS enabled+forced on household_members'
);
select is(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.household_invites'::regclass),
  true, 'RLS enabled+forced on household_invites'
);
select is(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.household_settings'::regclass),
  true, 'RLS enabled+forced on household_settings'
);

-- Enums ------------------------------------------------------------------

select has_enum('public', 'household_role', 'role enum exists');
select ok(
  enum_range(NULL::public.household_role)
    = '{owner,admin,member,viewer}'::public.household_role[],
  'roles are exactly owner/admin/member/viewer'
);

-- Capability helpers and RPCs exist --------------------------------------

select has_function('public', 'is_household_member', ARRAY['uuid']);
select has_function('public', 'has_household_role', ARRAY['uuid', 'public.household_role[]']);
select has_function('public', 'create_household_with_owner', ARRAY['uuid', 'text']);
select has_function('public', 'accept_household_invite', ARRAY['text']);
select has_function('public', 'revoke_household_invite', ARRAY['uuid']);
select has_function('public', 'custom_access_token_hook', ARRAY['jsonb']);

-- Helpers are not callable by unauthenticated roles ----------------------

select is(count(*)::int, 0, 'anon cannot execute capability helpers')
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_household_member', 'has_household_role')
  and has_function_privilege('anon', p.oid, 'execute');

select is(count(*)::int, 0, 'client roles cannot execute the access token hook')
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'custom_access_token_hook'
  and (
    has_function_privilege('anon', p.oid, 'execute')
    or has_function_privilege('authenticated', p.oid, 'execute')
  );

select * from finish();
rollback;
