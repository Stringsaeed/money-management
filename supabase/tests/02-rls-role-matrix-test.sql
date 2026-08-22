-- Role capability matrix enforced by RLS: viewer read-only, member cannot
-- administer, admin cannot touch owners or grant ownership, owner can.
-- UPDATE/DELETE denials assert zero rows affected (RLS filters, no error).

begin;
select * from no_plan();

\set claims_ALICE '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}'
\set claims_BOB '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}'
\set claims_CAROL '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}'
\set claims_DAVE '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}'


-- Fixtures (as superuser): one household, all four roles -----------------

insert into auth.users (id, email, encrypted_password)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@test.local', 'x'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.local',   'x'),
  ('33333333-3333-3333-3333-333333333333', 'carol@test.local', 'x'),
  ('44444444-4444-4444-4444-444444444444', 'dave@test.local',  'x')
on conflict do nothing;

select set_config('request.jwt.claims', :'claims_ALICE', true);
set local role authenticated;
select public.create_household_with_owner(
  'aaaaaaa1-0000-0000-0000-000000000000', 'Test Household');
reset role;

insert into public.household_members (household_id, user_id, role) values
  ('aaaaaaa1-0000-0000-0000-000000000000'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'admin'),
  ('aaaaaaa1-0000-0000-0000-000000000000'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'member'),
  ('aaaaaaa1-0000-0000-0000-000000000000'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'viewer');

-- Viewer (dave): read-only -----------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', :'claims_DAVE', true);

with u as (update public.household_settings set home_currency = 'EUR'
  returning 1
)
select count(*) from u \gset
select is(:count::int, 0, 'viewer cannot update settings');

with u as (update public.households set name = 'Hacked'
  returning 1
)
select count(*) from u \gset
select is(:count::int, 0, 'viewer cannot update the household');

select throws_ok(
  'insert into public.household_invites (id, household_id, token_hash, email, expires_at, created_by) '
  || 'values (gen_random_uuid(), ''aaaaaaa1-0000-0000-0000-000000000000''::uuid, ''x'', '
  || '''x@x.x'', now() + interval ''7 days'', auth.uid())',
  '42501',
  'new row violates row-level security policy for table "household_invites"'
);

reset role;

-- Member (carol): sees everything, administers nothing -------------------

set local role authenticated;
select set_config('request.jwt.claims', :'claims_CAROL', true);

with u as (update public.households set name = 'Carol''s Budget'
  returning 1
)
select count(*) from u \gset
select is(:count::int, 0, 'member cannot rename the household');

with u as (update public.household_members set role = 'admin' where user_id = auth.uid()
  returning 1
)
select count(*) from u \gset
select is(:count::int, 0, 'member cannot change their own role');

with u as (update public.household_settings set budget_activated = true
  returning 1
)
select count(*) from u \gset
select is(:count::int, 0, 'member cannot activate budgeting');

select throws_ok(
  format(
    'insert into public.households (id, name) values (%L, %L)',
    'aaaaaaa8-0000-0000-0000-000000000000', 'Direct'
  ),
  '42501',
  'permission denied for table households'
);

-- Member can leave through the dedicated RPC -----------------------------

select public.leave_household('aaaaaaa1-0000-0000-0000-000000000000'::uuid);
select ok(
  true, 'member left the household via leave_household()'
);

with u as (update public.household_members set status = 'active' where user_id = auth.uid()
  returning 1
)
select count(*) from u \gset
select is(:count::int, 0, 'left member cannot re-activate themselves');

select count(*) as left_rows from public.household_settings \gset
select is(:left_rows::int, 0, 'left member lost read access to settings');

reset role;

-- Admin (bob): manages members below owner, never owners -----------------

set local role authenticated;
select set_config('request.jwt.claims', :'claims_BOB', true);

with u as (update public.households set name = 'Renamed'
  returning 1
)
select count(*) from u \gset
select is(:count::int, 1, 'admin can rename the household');

with u as (
  update public.household_members set role = 'admin'
  where user_id = '33333333-3333-3333-3333-333333333333'
  returning 1
)
select count(*) from u \gset
select is(:count::int, 1, 'admin can promote a member to admin');

-- USING passes (carol is an editable admin row), so the CHECK rejection is
-- an error rather than a silent zero-row update.
select throws_ok(
  'update public.household_members set role = ''owner'' where user_id = ''33333333-3333-3333-3333-333333333333''',
  '42501',
  'new row violates row-level security policy for table "household_members"'
);

with u as (
  update public.household_members set status = 'archived'
  where user_id = '11111111-1111-1111-1111-111111111111'
  returning 1
)
select count(*) from u \gset
select is(:count::int, 0, 'admin cannot archive the owner');

-- No DELETE privilege is granted at all: removal is archive-only.
select throws_ok(
  'delete from public.household_members where user_id = ''33333333-3333-3333-3333-333333333333''',
  '42501',
  'permission denied for table household_members'
);

reset role;

-- Owner (alice): full control below ownership ----------------------------

set local role authenticated;
select set_config('request.jwt.claims', :'claims_ALICE', true);

with u as (update public.household_settings set home_currency = 'EUR'
  returning 1
)
select count(*) from u \gset
select is(:count::int, 1, 'owner can update settings');

with u as (
  update public.household_members set role = 'member'
  where user_id = '22222222-2222-2222-2222-222222222222'
  returning 1
)
select count(*) from u \gset
select is(:count::int, 1, 'owner can demote an admin');

-- Owner cannot leave without transferring ownership ---------------------

select throws_ok(
  'select public.leave_household(''aaaaaaa1-0000-0000-0000-000000000000''::uuid)',
  'P0001',
  'OWNER_CANNOT_LEAVE: transfer ownership before leaving the household',
  'owner must transfer ownership before leaving'
);

reset role;

select * from finish();
rollback;
