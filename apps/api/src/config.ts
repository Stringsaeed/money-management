import { HOUSEHOLD_ROLES, type HouseholdRole } from "@trove/protocol";

/**
 * Environment parsing for apps/api.
 *
 * Fails fast at boot with an actionable message rather than serving traffic
 * with misconfigured auth — a wrong SUPABASE_URL would otherwise reject every
 * valid token (or worse, accept none) with no obvious cause.
 */

export interface AppConfig {
  port: number;
  /** Supabase project URL, no trailing slash. Derives issuer + JWKS endpoints. */
  supabaseUrl: string;
  /** Optional explicit JWKS URL override (used by tests and self-hosted gateways). */
  jwksUrl?: string;
}

export type { HouseholdRole };

const ROLE_SET = new Set<string>(HOUSEHOLD_ROLES);

function isHouseholdRole(value: string): value is HouseholdRole {
  return ROLE_SET.has(value);
}

function trimTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function parseConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const rawSupabaseUrl = env.SUPABASE_URL?.trim();
  if (!rawSupabaseUrl)
    throw new Error(
      "Missing required environment variable SUPABASE_URL. " +
        "Set it from your Supabase project settings before starting the API.",
    );

  if (!URL.canParse(rawSupabaseUrl))
    throw new Error(
      `Invalid SUPABASE_URL "${rawSupabaseUrl}": expected an absolute URL such as https://<project-ref>.supabase.co.`,
    );

  const portRaw = env.PORT?.trim();
  const port = portRaw ? Number(portRaw) : 3000;
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error(`Invalid PORT "${portRaw}": expected an integer between 1 and 65535.`);

  return {
    port,
    supabaseUrl: trimTrailingSlash(rawSupabaseUrl),
    ...(env.SUPABASE_JWKS_URL?.trim()
      ? { jwksUrl: trimTrailingSlash(env.SUPABASE_JWKS_URL.trim()) }
      : {}),
  };
}

/** Supabase Auth issuer for a project URL, e.g. `https://<ref>.supabase.co/auth/v1`. */
export function supabaseIssuer(supabaseUrl: string): string {
  return `${trimTrailingSlash(supabaseUrl)}/auth/v1`;
}

/** Fail-closed normalization: unknown roles are dropped, never trusted. */
export function parseHouseholdRoles(value: unknown): Record<string, HouseholdRole> {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) return {};

  const roles: Record<string, HouseholdRole> = {};
  for (const [householdId, role] of Object.entries(value)) {
    if (typeof role === "string" && isHouseholdRole(role)) roles[householdId] = role;
  }
  return roles;
}
