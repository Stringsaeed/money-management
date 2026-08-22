-- Custom access token hook: stamps household/role claims into issued JWTs,
-- overwriting stale claim values, and tolerates membership-less users.

begin;
select * from no_plan();

insert into auth.users (id, email, encrypted_password)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@test.local', 'x'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.local',   'x'),
  ('33333333-3333-3333-3333-333333333333', 'carol@test.local', 'x')
on conflict do nothing;

-- Alice owns two households; Bob owns none --------------------------------

insert into public.households (id, name, created_by, updated_by)
values
  ('aaaaaaa1-0000-0000-0000-000000000000', 'First',  '11111111-1111-1111-1111-111111111111'::uuid,
   '11111111-1111-1111-1111-111111111111'::uuid),
  ('aaaaaaa2-0000-0000-0000-000000000000', 'Second', '11111111-1111-1111-1111-111111111111'::uuid,
   '11111111-1111-1111-1111-111111111111'::uuid);

insert into public.household_members (household_id, user_id, role, joined_at) values
  ('aaaaaaa1-0000-0000-0000-000000000000'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'owner',
   timestamptz '2026-01-01 00:00:00+00'),
  ('aaaaaaa2-0000-0000-0000-000000000000'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'admin',
   timestamptz '2026-02-01 00:00:00+00');

-- Stamps the household_roles map and most recent active household ---------

select is(
  (
    public.custom_access_token_hook(
      jsonb_build_object(
        'user_id', '11111111-1111-1111-1111-111111111111',
        'claims', jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111', 'role', 'authenticated')
      )
    ) -> 'claims' -> 'household_roles'
  ),
  jsonb_build_object(
    'aaaaaaa1-0000-0000-0000-000000000000', 'owner',
    'aaaaaaa2-0000-0000-0000-000000000000', 'admin'
  ),
  'hook stamps a role map for every active membership'
);

select is(
  (
    public.custom_access_token_hook(
      jsonb_build_object('user_id', '11111111-1111-1111-1111-111111111111')
    ) -> 'claims' ->> 'active_household_id'
  ),
  'aaaaaaa2-0000-0000-0000-000000000000',
  'active_household_id is the most recently joined active membership'
);

-- Overwrites stale claims on refresh --------------------------------------

select is(
  (
    public.custom_access_token_hook(
      jsonb_build_object(
        'user_id', '11111111-1111-1111-1111-111111111111',
        'claims', jsonb_build_object(
          'role', 'authenticated',
          'household_roles', jsonb_build_object('stale-household-id', 'owner'),
          'active_household_id', 'stale-household-id'
        )
      )
    ) -> 'claims' ->> 'active_household_id'
  ),
  'aaaaaaa2-0000-0000-0000-000000000000',
  'fresh memberships overwrite stale claim values on token refresh'
);

-- Membership-less user gets an empty map and null id ----------------------

select is(
  (
    public.custom_access_token_hook(
      jsonb_build_object('user_id', '22222222-2222-2222-2222-222222222222')
    ) -> 'claims' ->> 'household_roles'
  ),
  '{}',
  'membership-less user gets an empty household_roles map'
);

-- Archived membership does not count --------------------------------------

update public.household_members
set status = 'archived', archived_at = now()
where household_id = 'aaaaaaa2-0000-0000-0000-000000000000';

select is(
  (
    public.custom_access_token_hook(
      jsonb_build_object('user_id', '11111111-1111-1111-1111-111111111111')
    ) -> 'claims' ->> 'active_household_id'
  ),
  'aaaaaaa1-0000-0000-0000-000000000000',
  'archived memberships are excluded from claims'
);

-- No user id in the event is passed through untouched ---------------------

select ok(
  public.custom_access_token_hook('{"claims": {"role": "authenticated"}}'::jsonb)
    @> '{"claims": {"role": "authenticated"}}'::jsonb,
  'events without a resolvable user id pass through unchanged'
);

select * from finish();
rollback;
