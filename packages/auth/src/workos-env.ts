export interface WorkOSServerEnv {
  readonly WORKOS_API_KEY: string;
  readonly WORKOS_CLIENT_ID: string;
  readonly WORKOS_TOKEN_AUDIENCE?: string;
  readonly WORKOS_TOKEN_ISSUER?: string;
}

export interface ResolvedWorkOSVerifyEnv {
  readonly apiKey: string;
  readonly clientId: string;
  readonly audience: string;
  readonly issuer: string;
}

/** Defaults: audience = client id; issuer = https://api.workos.com (confirm from real `iss`). */
export function resolveWorkOSVerifyEnv(env: WorkOSServerEnv): ResolvedWorkOSVerifyEnv {
  const clientId = env.WORKOS_CLIENT_ID.trim();
  const apiKey = env.WORKOS_API_KEY.trim();
  if (!clientId) throw new Error("WORKOS_CLIENT_ID is required.");
  if (!apiKey) throw new Error("WORKOS_API_KEY is required.");

  return {
    apiKey,
    clientId,
    audience: (env.WORKOS_TOKEN_AUDIENCE ?? clientId).trim() || clientId,
    issuer: (env.WORKOS_TOKEN_ISSUER ?? "https://api.workos.com").trim(),
  };
}
