CREATE SCHEMA IF NOT EXISTS spike;

CREATE TABLE IF NOT EXISTS spike.membership (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  household_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS spike.accounts (
  id text PRIMARY KEY,
  household_id text NOT NULL,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS spike.categories (
  id text PRIMARY KEY,
  household_id text NOT NULL,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS spike.transactions (
  id text PRIMARY KEY,
  household_id text NOT NULL,
  note text NOT NULL
);

GRANT USAGE ON SCHEMA spike TO :"psrole";
GRANT SELECT ON TABLE spike.accounts, spike.categories, spike.transactions, spike.membership TO :"psrole";

DROP PUBLICATION IF EXISTS powersync;
CREATE PUBLICATION powersync FOR TABLE spike.accounts, spike.categories, spike.transactions, spike.membership;
