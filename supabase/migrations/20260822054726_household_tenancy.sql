-- Household tenancy foundation (Phase 0).
--
-- Spec: docs/architecture/backend-architecture.md ("Canonical model" + invariants 15/16):
-- - Households are the tenancy root; every fact table carries household_id.
-- - Four roles (owner, admin, member, viewer) resolved through one capability map.
-- - Membership is archived, never deleted, so authorship attribution survives removal.
-- Universal conventions: uuid PKs (client-generated), version integers on mutable
-- entities, created_by/updated_by attribution, timestamptz timestamps.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.household_role as enum ('owner', 'admin', 'member', 'viewer');

create type public.member_status as enum ('active', 'archived');

create type public.invite_status as enum ('pending', 'accepted', 'revoked', 'expired');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.households (
  id uuid primary key,
  name text not null check (char_length(name) between 1 and 100),
  version integer not null default 1,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.households is
  'Tenancy root. Every fact table carries household_id.';

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.household_role not null default 'member',
  status public.member_status not null default 'active',
  -- Archived, never deleted: a removed member keeps authorship of their history.
  archived_at timestamptz,
  invited_by uuid references auth.users (id) on delete set null,
  joined_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

comment on table public.household_members is
  'Household membership with four roles. Removal archives the row; deletion only happens when the referenced auth user is hard-deleted.';

-- No optimistic-concurrency `version` column here: membership changes are
-- low-frequency admin operations guarded by role checks, and OCC via the
-- command pipeline (expectedVersion preconditions) starts with the Phase 1
-- fact tables.

create index household_members_user_id_status_idx
  on public.household_members (user_id, status)
  where status = 'active';

-- Deliberately NOT composite-keyed: tenancy metadata, unlike financial fact
-- tables. Invariant 15's composite (household_id, id) convention applies to
-- domain facts introduced from Phase 1 onward (accounts, transactions, …).
create table public.household_invites (
  id uuid primary key,
  household_id uuid not null references public.households (id) on delete cascade,
  -- SHA-256 of the raw invite token; the raw token lives only in invite links.
  token_hash text not null unique,
  email text not null,
  role public.household_role not null default 'member'
    check (role in ('admin', 'member', 'viewer')),
  status public.invite_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_by uuid references auth.users (id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.household_invites is
  'Invite links for joining a household. Only a hash of the token is stored.';

create table public.household_settings (
  -- One-to-one extension of households; scoped half of the client's app_settings.
  household_id uuid primary key references public.households (id) on delete cascade,
  -- Provisioned with the client's chosen currency via create_household_with_owner;
  -- defaults keep the row valid if the client defers the choice.
  home_currency text not null default 'USD' check (char_length(home_currency) = 3),
  budget_activated boolean not null default false,
  version integer not null default 1,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.household_settings is
  'Household-scoped settings (home currency, budget activation state). User preferences and migration bookkeeping stay client-local forever.';

-- ---------------------------------------------------------------------------
-- Capability helpers
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER so policy evaluation reads household_members without
-- recursing into its own RLS policies. Each body filters by auth.uid(), and
-- execute is revoked from anon, so they expose nothing on their own.

create function public.is_household_member(household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members m
    where m.household_id = is_household_member.household_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
$$;

comment on function public.is_household_member(uuid) is
  'True when the caller holds an active membership in the household.';

create function public.has_household_role(p_household_id uuid, p_roles public.household_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members m
    where m.household_id = has_household_role.p_household_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any (has_household_role.p_roles)
  )
$$;

comment on function public.has_household_role(uuid, public.household_role[]) is
  'True when the caller''s active role in the household is one of p_roles.';

revoke execute on function public.is_household_member(uuid)
  from anon, authenticated, public;
revoke execute on function public.has_household_role(uuid, public.household_role[])
  from anon, authenticated, public;
grant execute on function public.is_household_member(uuid), public.has_household_role(uuid, public.household_role[])
  to authenticated;

-- ---------------------------------------------------------------------------
-- Atomic RPCs
-- ---------------------------------------------------------------------------
-- The Data API cannot write two tables transactionally; creating a household
-- and its owner membership must be atomic (invariant 14 discipline).

create function public.create_household_with_owner(p_household_id uuid, p_name text)
returns public.households
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_household public.households;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED: sign in before creating a household';
  end if;

  insert into public.households (id, name, created_by, updated_by)
  values (p_household_id, p_name, v_uid, v_uid)
  returning * into v_household;

  insert into public.household_members (household_id, user_id, role, created_by, updated_by)
  values (p_household_id, v_uid, 'owner', v_uid, v_uid);

  insert into public.household_settings (household_id, created_by, updated_by)
  values (p_household_id, v_uid, v_uid);

  return v_household;
end;
$$;

comment on function public.create_household_with_owner(uuid, text) is
  'Atomically creates a household, its owner membership, and default settings.';

revoke execute on function public.create_household_with_owner(uuid, text)
  from anon, authenticated, public;
grant execute on function public.create_household_with_owner(uuid, text)
  to authenticated;

create function public.accept_household_invite(p_token text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.household_invites;
  v_household_id uuid;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED: sign in before accepting an invite';
  end if;

  select * into v_invite
  from public.household_invites
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and status = 'pending'
    and expires_at > now()
  for update;

  if v_invite.id is null then
    raise exception 'INVITE_INVALID: this invite does not exist or can no longer be accepted';
  end if;

  -- Invites are bearer credentials: whoever holds the raw token may redeem it,
  -- and the invite email is informational only (deliberate, keeps redemption
  -- simple; tightening to email-bound invites would require verified-email checks).
  if exists (
    select 1 from public.household_members m
    where m.household_id = v_invite.household_id
      and m.user_id = v_uid
      and m.status = 'active'
  ) then
    raise exception 'ALREADY_MEMBER: you are already an active member of this household';
  end if;

  update public.household_invites
  set status = 'accepted',
      accepted_by = v_uid,
      accepted_at = now(),
      updated_by = v_uid
  where id = v_invite.id;

  -- Re-activating is how a previously removed member rejoins via a new link.
  insert into public.household_members (household_id, user_id, role, invited_by, created_by, updated_by)
  values (v_invite.household_id, v_uid, v_invite.role, v_invite.created_by, v_uid, v_uid)
  on conflict (household_id, user_id) do update
    set role = excluded.role,
        status = 'active',
        archived_at = null,
        updated_by = v_uid
    where household_members.status = 'archived';

  return v_invite.household_id;
end;
$$;

comment on function public.accept_household_invite(text) is
  'Atomically marks an invite accepted and creates (or re-activates) the member row.';

revoke execute on function public.accept_household_invite(text)
  from anon, authenticated, public;
grant execute on function public.accept_household_invite(text)
  to authenticated;

create function public.revoke_household_invite(p_invite_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED: sign in before revoking an invite';
  end if;

  update public.household_invites i
  set status = 'revoked',
      revoked_at = now(),
      updated_by = v_uid
  where i.id = revoke_household_invite.p_invite_id
    and i.status = 'pending'
    and exists (
      select 1
      from public.household_members m
      where m.household_id = i.household_id
        and m.user_id = v_uid
        and m.status = 'active'
        and m.role in ('owner', 'admin')
    );
end;
$$;

comment on function public.revoke_household_invite(uuid) is
  'Marks a pending invite revoked; only household owners and admins may revoke.';

revoke execute on function public.revoke_household_invite(uuid)
  from anon, authenticated, public;
grant execute on function public.revoke_household_invite(uuid)
  to authenticated;

create function public.leave_household(p_household_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED: sign in before leaving a household';
  end if;

  -- The owner must transfer ownership first; letting the last owner leave
  -- would strand the household with no admin.
  if exists (
    select 1 from public.household_members m
    where m.household_id = leave_household.p_household_id
      and m.user_id = v_uid
      and m.status = 'active'
      and m.role = 'owner'
  ) then
    raise exception 'OWNER_CANNOT_LEAVE: transfer ownership before leaving the household';
  end if;

  update public.household_members m
  set status = 'archived',
      archived_at = now(),
      updated_by = v_uid
  where m.household_id = leave_household.p_household_id
    and m.user_id = v_uid
    and m.status = 'active';
end;
$$;

comment on function public.leave_household(uuid) is
  'Archives the caller''s own active membership (leaving); owners must transfer ownership first.';

revoke execute on function public.leave_household(uuid)
  from anon, authenticated, public;
grant execute on function public.leave_household(uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------

alter table public.households enable row level security;
alter table public.households force row level security;
alter table public.household_members enable row level security;
alter table public.household_members force row level security;
alter table public.household_invites enable row level security;
alter table public.household_invites force row level security;
alter table public.household_settings enable row level security;
alter table public.household_settings force row level security;

-- households ------------------------------------------------------------

create policy "members can view their household"
  on public.households for select
  to authenticated
  using (public.is_household_member(id));

-- Creation itself goes through create_household_with_owner(); no direct INSERT
-- policy means the owner-membership invariant cannot be bypassed via the API.

create policy "owners and admins can update their household"
  on public.households for update
  to authenticated
  using (public.has_household_role(id, array['owner', 'admin']::public.household_role[]))
  with check (
    public.has_household_role(id, array['owner', 'admin']::public.household_role[])
  );

-- No DELETE policy anywhere: households are archived by application flow, never
-- dropped while financial history exists (ADR-0009).

-- household_members ------------------------------------------------------

create policy "members can view co-members"
  on public.household_members for select
  to authenticated
  using (public.is_household_member(household_id));

-- Inserts happen only through accept_household_invite() /
-- create_household_with_owner(); no direct INSERT policy.

-- NOTE: with self-service writes moved to leave_household(), this policy has
-- exactly one purpose: admins manage members below ownership. Permissive
-- policies OR their USING/WITH CHECK independently, so each policy's WITH
-- CHECK stays self-contained.
create policy "owners and admins can update members below them"
  on public.household_members for update
  to authenticated
  using (
    public.has_household_role(household_id, array['owner', 'admin']::public.household_role[])
    and role <> 'owner'              -- nobody edits an owner row except via ownership transfer flows
    and user_id <> (select auth.uid()) -- no self-service changes; leaving goes through leave_household()
  )
  with check (
    public.has_household_role(household_id, array['owner', 'admin']::public.household_role[])
    -- Only an owner may grant the owner role; admins manage admin/member/viewer.
    and (
      public.has_household_role(household_id, array['owner']::public.household_role[])
      or role <> 'owner'
    )
  );

-- Members archive their own membership via leave_household(); there is
-- deliberately no self-service UPDATE path whose CHECK could combine with
-- other policies' checks.

-- household_invites ------------------------------------------------------

create policy "owners and admins can view invites"
  on public.household_invites for select
  to authenticated
  using (public.has_household_role(household_id, array['owner', 'admin']::public.household_role[]));

create policy "owners and admins can create invites"
  on public.household_invites for insert
  to authenticated
  with check (
    public.has_household_role(household_id, array['owner', 'admin']::public.household_role[])
    and created_by = (select auth.uid())
  );

-- Revocation goes through revoke_household_invite(); no direct UPDATE policy,
-- so pending invites cannot be silently marked accepted or retargeted.

-- No DELETE policy: invite rows are audit trail, revoked not removed.

-- household_settings -----------------------------------------------------

create policy "members can view settings"
  on public.household_settings for select
  to authenticated
  using (public.is_household_member(household_id));

create policy "owners and admins can manage settings"
  on public.household_settings for update
  to authenticated
  using (public.has_household_role(household_id, array['owner', 'admin']::public.household_role[]))
  with check (public.has_household_role(household_id, array['owner', 'admin']::public.household_role[]));

-- Settings rows are provisioned atomically by create_household_with_owner();
-- there is deliberately no INSERT policy through the Data API.

-- ---------------------------------------------------------------------------
-- Data API exposure
-- ---------------------------------------------------------------------------
-- New tables are NOT auto-granted to API roles; grant exactly what the policy
-- matrix permits above. Notably there is no DELETE anywhere.

grant select, update on public.households to authenticated;
grant select, update on public.household_members to authenticated;
grant select, insert on public.household_invites to authenticated;
grant select, update on public.household_settings to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
-- household_changes does not exist yet (Phase 1); when it lands it joins the
-- supabase_realtime publication pushing {seq, effects[]} only. Nothing to
-- publish from these tenancy tables today.
