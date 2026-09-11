export const DEFAULT_WORKOS_TOKEN_ISSUER = "https://api.workos.com";

export interface WorkOSServerEnv {
  readonly WORKOS_API_KEY: string;
  readonly WORKOS_CLIENT_ID: string;
  readonly WORKOS_TOKEN_AUDIENCE?: string;
  readonly WORKOS_TOKEN_ISSUER?: string;
  /** WorkOS custom auth domain hostname (no scheme), e.g. auth.trove.ing. */
  readonly WORKOS_AUTH_HOSTNAME?: string;
}

export interface ResolvedWorkOSVerifyEnv {
  readonly apiKey: string;
  readonly clientId: string;
  readonly audience: string;
  readonly issuer: string;
  readonly authHostname: string | null;
}

/** Slash twins for a single issuer URL (WorkOS docs disagree on trailing slash). */
export function issuerVariants(issuer: string): string[] {
  const trimmed = issuer.trim();
  if (!trimmed) return [];
  if (trimmed.endsWith("/")) {
    return [trimmed, trimmed.slice(0, -1)];
  }
  return [trimmed, `${trimmed}/`];
}

/**
 * Accept configured issuer, the WorkOS API default, and optional custom auth domain.
 * Live Sync 401 `claim_iss` happened when deploy verified only `https://api.workos.com`
 * while AuthKit minted `iss` from the custom auth hostname (`auth.trove.ing`).
 */
export function resolveIssuerCandidates(input: {
  readonly issuer: string;
  readonly authHostname?: string | null;
}): string[] {
  const out = new Set<string>();
  for (const value of issuerVariants(input.issuer)) out.add(value);
  for (const value of issuerVariants(DEFAULT_WORKOS_TOKEN_ISSUER)) out.add(value);

  const rawHost = input.authHostname?.trim() ?? "";
  if (rawHost) {
    const hostname = rawHost.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
    if (hostname) {
      for (const value of issuerVariants(`https://${hostname}`)) out.add(value);
    }
  }

  return [...out];
}

/** Defaults: audience = client id; issuer = https://api.workos.com (confirm from real `iss`). */
export function resolveWorkOSVerifyEnv(env: WorkOSServerEnv): ResolvedWorkOSVerifyEnv {
  const clientId = env.WORKOS_CLIENT_ID.trim();
  const apiKey = env.WORKOS_API_KEY.trim();
  if (!clientId) throw new Error("WORKOS_CLIENT_ID is required.");
  if (!apiKey) throw new Error("WORKOS_API_KEY is required.");

  const authHostname = (env.WORKOS_AUTH_HOSTNAME ?? "").trim() || null;

  return {
    apiKey,
    clientId,
    audience: (env.WORKOS_TOKEN_AUDIENCE ?? clientId).trim() || clientId,
    issuer: (env.WORKOS_TOKEN_ISSUER ?? DEFAULT_WORKOS_TOKEN_ISSUER).trim() || DEFAULT_WORKOS_TOKEN_ISSUER,
    authHostname,
  };
}
