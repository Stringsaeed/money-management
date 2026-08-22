/**
 * Typed Hono environment: what route handlers may read from request context.
 *
 * The auth middleware populates `auth` for every verified request; unauthenticated
 * routes simply never read it. Claims come from Supabase's custom access token hook
 * (see supabase/migrations/*_custom_access_token_hook.sql) and are a latency filter
 * only — live membership is re-checked per command once the command pipeline lands.
 */
import type { HouseholdRole } from "./config.js";

export type { HouseholdRole };

export interface AuthContext {
  /** Supabase user id (JWT `sub`). */
  userId: string;
  /** Active household memberships at token-issuance time: `{ household_id: role }`. */
  householdRoles: Record<string, HouseholdRole>;
  /** Most recently joined active household, if any. */
  activeHouseholdId: string | null;
}

export interface ApiEnv {
  Variables: {
    auth: AuthContext;
  };
}
