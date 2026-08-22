-- Invite lifecycle: creation by admins+, acceptance via RPC (valid, expired,
-- revoked, unknown tokens), and re-activation of a previously removed member.

begin;
select * from no_plan();

\set claims_ALICE '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}'
\set claims_BOB '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}'


insert into auth.users (id, email, encrypted_password)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@test.local', 'x'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.local',   'x')
on conflict do nothing;

select set_config('request.jwt.claims', :'claims_ALICE', true);
set local role authenticated;
select public.create_household_with_owner(
  'aaaaaaa1-0000-0000-0000-000000000000', 'Invite Household');

-- Alice creates invites with known raw tokens -----------------------------

insert into public.household_invites (id, household_id, token_hash, email, role, expires_at, created_by)
values
  ('bbbbbbb1-0000-0000-0000-000000000000',
   'aaaaaaa1-0000-0000-0000-000000000000'::uuid,
   encode(extensions.digest('valid-token', 'sha256'), 'hex'),
   'bob@example.com', 'member', now() + interval '7 days',
   '11111111-1111-1111-1111-111111111111'::uuid),
  ('bbbbbbb2-0000-0000-0000-000000000000',
   'aaaaaaa1-0000-0000-0000-000000000000'::uuid,
   encode(extensions.digest('expired-token', 'sha256'), 'hex'),
   'expired@example.com', 'viewer', now() - interval '7 days',
   '11111111-1111-1111-1111-111111111111'::uuid),
  ('bbbbbbb4-0000-0000-0000-000000000000',
   'aaaaaaa1-0000-0000-0000-000000000000'::uuid,
   encode(extensions.digest('revoke-target-token', 'sha256'), 'hex'),
   'revoke@example.com', 'member', now() + interval '7 days',
   '11111111-1111-1111-1111-111111111111'::uuid);

reset role;

-- Bob accepts the valid invite and becomes a member -----------------------

set local role authenticated;
select set_config('request.jwt.claims', :'claims_BOB', true);

select is(
  public.accept_household_invite('valid-token'),
  'aaaaaaa1-0000-0000-0000-000000000000'::uuid,
  'valid token returns the household id'
);

select is(
  (select role from public.household_members where user_id = auth.uid()),
  'member'::public.household_role,
  'accepted invite creates membership with the invited role'
);

select throws_ok(
  'select public.accept_household_invite(''valid-token'')',
  'P0001',
  'INVITE_INVALID: this invite does not exist or can no longer be accepted'
);

-- A second pending invite for the same household is refused outright
-- instead of being silently consumed.
reset role;
insert into public.household_invites (id, household_id, token_hash, email, role, expires_at, created_by)
values (
  'bbbbbbb6-0000-0000-0000-000000000000',
  'aaaaaaa1-0000-0000-0000-000000000000'::uuid,
  encode(extensions.digest('second-invite', 'sha256'), 'hex'),
  'bob@example.com', 'member', now() + interval '7 days',
  '11111111-1111-1111-1111-111111111111'::uuid
);
set local role authenticated;
select set_config('request.jwt.claims', :'claims_BOB', true);

select throws_ok(
  'select public.accept_household_invite(''second-invite'')',
  'P0001',
  'ALREADY_MEMBER: you are already an active member of this household'
);

select throws_ok(
  'select public.accept_household_invite(''never-existed'')',
  'P0001',
  'INVITE_INVALID: this invite does not exist or can no longer be accepted'
);

select throws_ok(
  'select public.accept_household_invite(''expired-token'')',
  'P0001',
  'INVITE_INVALID: this invite does not exist or can no longer be accepted'
);

select throws_ok(
  'insert into public.household_invites (id, household_id, token_hash, email, expires_at, created_by) '
  || 'values (gen_random_uuid(), ''aaaaaaa1-0000-0000-0000-000000000000''::uuid, ''x'', '
  || '''x@x.x'', now() + interval ''7 days'', auth.uid())',
  '42501',
  'new row violates row-level security policy for table "household_invites"'
);

-- Member cannot revoke invites --------------------------------------------

select public.revoke_household_invite('bbbbbbb4-0000-0000-0000-000000000000'::uuid);

reset role;
select is(
  (
    select status from public.household_invites
    where id = 'bbbbbbb4-0000-0000-0000-000000000000'::uuid
  ),
  'pending'::public.invite_status,
  'member revoking an invite is a no-op'
);

-- Owner revokes the pending invite; acceptance must fail ------------------

set local role authenticated;
select set_config('request.jwt.claims', :'claims_ALICE', true);
select public.revoke_household_invite('bbbbbbb4-0000-0000-0000-000000000000'::uuid);
reset role;

select is(
  (
    select status from public.household_invites
    where id = 'bbbbbbb4-0000-0000-0000-000000000000'::uuid
  ),
  'revoked'::public.invite_status,
  'owner revoked the pending invite'
);

set local role authenticated;
select set_config('request.jwt.claims', :'claims_BOB', true);

select throws_ok(
  'select public.accept_household_invite(''revoke-target-token'')',
  'P0001',
  'INVITE_INVALID: this invite does not exist or can no longer be accepted'
);

reset role;

-- Removed member can rejoin through a fresh invite ------------------------

update public.household_members
set status = 'archived', archived_at = now()
where user_id = '22222222-2222-2222-2222-222222222222'::uuid;

insert into public.household_invites (id, household_id, token_hash, email, role, expires_at, created_by)
values (
  'bbbbbbb5-0000-0000-0000-000000000000',
  'aaaaaaa1-0000-0000-0000-000000000000'::uuid,
  encode(extensions.digest('welcome-back', 'sha256'), 'hex'),
  'bob@example.com', 'member', now() + interval '7 days',
  '11111111-1111-1111-1111-111111111111'::uuid
);

set local role authenticated;
select set_config('request.jwt.claims', :'claims_BOB', true);

select public.accept_household_invite('welcome-back');

select is(
  (
    select status from public.household_members
    where user_id = '22222222-2222-2222-2222-222222222222'::uuid
  ),
  'active'::public.member_status,
  'removed member rejoined as active through the new invite'
);

reset role;

select * from finish();
rollback;
