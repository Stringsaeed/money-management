CREATE TABLE IF NOT EXISTS public.membership (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  household_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.accounts (
  id text PRIMARY KEY,
  household_id text NOT NULL,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.categories (
  id text PRIMARY KEY,
  household_id text NOT NULL,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id text PRIMARY KEY,
  household_id text NOT NULL,
  note text NOT NULL
);

DO $role$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'powersync_role') THEN
    EXECUTE format(
      'CREATE ROLE powersync_role WITH REPLICATION BYPASSRLS LOGIN PASSWORD %L',
      current_setting('spike.powersync_password', true)
    );
  ELSE
    BEGIN
      EXECUTE 'ALTER ROLE powersync_role WITH REPLICATION BYPASSRLS LOGIN';
    EXCEPTION
      WHEN insufficient_privilege THEN
        NULL;
    END;
  END IF;
END
$role$;

GRANT SELECT ON TABLE public.accounts, public.categories, public.transactions, public.membership TO powersync_role;

DROP PUBLICATION IF EXISTS powersync;
CREATE PUBLICATION powersync FOR TABLE public.accounts, public.categories, public.transactions, public.membership;
