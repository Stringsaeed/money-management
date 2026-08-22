/**
 * Server-side Postgres schema (Drizzle), scoped to household tenancy per the
 * backend architecture spec.
 *
 * The source of truth for DDL is `supabase/migrations/*.sql`, applied by the
 * Supabase CLI. Tables land here phase by phase as the sync substrate ships —
 * Phase 1 introduces the six migrated ledger tables with composite
 * `(household_id, id)` primary keys; Phase 3 adds the envelope/budget domain
 * (workspaces, envelopes, period-effective mappings, append-only assignments,
 * refund links, and the `household_changes` activity log).
 */
export const SCHEMA_VERSION = 0;
