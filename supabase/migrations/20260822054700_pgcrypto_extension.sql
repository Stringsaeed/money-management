-- pgcrypto provides digest()/encode() used by the invite token hashing in the
-- tenancy migration. Explicit rather than relying on Supabase's default
-- pre-install so the dependency is portable to plain Postgres.
create extension if not exists pgcrypto with schema extensions;
