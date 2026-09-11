import type { Context as HonoContext } from "hono";
import {
  readBearerToken,
  resolveWorkOSVerifyEnv,
  verifyAccessToken,
  type AuthSession,
} from "@trove/auth";
import { env } from "@trove/env/server";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const session = await resolveSession(context.req.raw.headers.get("Authorization"));
  let waitUntil: ((promise: Promise<unknown>) => void) | undefined;
  try {
    waitUntil = context.executionCtx.waitUntil.bind(context.executionCtx);
  } catch {
    // Node/test adapters have no Workers execution context.
  }
  return {
    session,
    waitUntil,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

async function resolveSession(authorization: string | null): Promise<AuthSession | null> {
  const token = readBearerToken(authorization);
  if (!token) return null;

  try {
    const resolved = resolveWorkOSVerifyEnv({
      WORKOS_API_KEY: env.WORKOS_API_KEY,
      WORKOS_CLIENT_ID: env.WORKOS_CLIENT_ID,
      WORKOS_TOKEN_AUDIENCE: env.WORKOS_TOKEN_AUDIENCE,
      WORKOS_TOKEN_ISSUER: env.WORKOS_TOKEN_ISSUER,
    });
    return await verifyAccessToken(token, {
      clientId: resolved.clientId,
      audience: resolved.audience,
      issuer: resolved.issuer,
    });
  } catch {
    return null;
  }
}
