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

GRANT SELECT ON TABLE public.accounts, public.categories, public.transactions, public.membership TO :"psrole";

DROP PUBLICATION IF EXISTS powersync;
CREATE PUBLICATION powersync FOR TABLE public.accounts, public.categories, public.transactions, public.membership;
