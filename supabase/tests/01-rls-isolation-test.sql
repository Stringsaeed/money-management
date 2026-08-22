-- RLS isolation: cross-household reads and writes are rejected, and the
-- unauthenticated anon role sees nothing. This is the Phase 0 negative-test
-- seam the backend spec's acceptance criteria call for.

begin;
select * from no_plan();


-- Fixtures: two households owned by different users ----------------------

insert into auth.users (id, email, encrypted_password)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@test.local', 'x'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.local', 'x')
on conflict do nothing;

select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
set local role authenticated;
select public.create_household_with_owner(
  'aaaaaaa1-0000-0000-0000-000000000000', 'Alice Household');
reset role;

select set_config('request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
set local role authenticated;
select public.create_household_with_owner(
  'aaaaaaa2-0000-0000-0000-000000000000', 'Bob Household');
reset role;

-- Alice cannot see any of Bob's tenancy rows -----------------------------

select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
set local role authenticated;

select count(*) as hh from public.households \gset
select is(:hh::int, 1, 'alice sees exactly her own household');

select count(*) as mem from public.household_members \gset
select is(:mem::int, 1, 'alice sees only co-members of her household');

select count(*) as inv from public.household_invites \gset
select is(:inv::int, 0, 'alice sees no invites from other households');

select count(*) as st from public.household_settings \gset
select is(:st::int, 1, 'alice sees only her household settings');

-- Cross-household UPDATE silently affects nothing ------------------------

update public.household_settings
set home_currency = 'EUR'
where household_id = 'aaaaaaa2-0000-0000-0000-000000000000';

reset role;
select is(
  (
    select home_currency
    from public.household_settings
    where household_id = 'aaaaaaa2-0000-0000-0000-000000000000'::uuid
  ),
  'USD',
  'cross-household settings update changed nothing'
);

-- Anon sees nothing and can write nothing --------------------------------

set local role anon;

select throws_ok(
  'select count(*) from public.households',
  '42501',
  'permission denied for table households',
  'anon cannot read households'
);

select throws_ok(
  format(
    'insert into public.households (id, name) values (%L, %L)',
    'aaaaaaa9-0000-0000-0000-000000000000', 'Sneaky'
  ),
  '42501',
  'permission denied for table households',
  'anon cannot insert households'
);

reset role;

select * from finish();
rollback;
