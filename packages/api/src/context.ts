import type { Context as HonoContext } from "hono";
import {
  TokenVerifyError,
  readBearerToken,
  resolveWorkOSVerifyEnv,
  verifyAccessToken,
  type AuthSession,
  type TokenVerifyFailureCode,
} from "@trove/auth";
import { env } from "@trove/env/server";

import { logTokenVerifyFailure, tokenVerifyFailureDiag } from "./token-verify-diagnostics";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const resolved = await resolveSession(context.req.raw.headers.get("Authorization"));
  let waitUntil: ((promise: Promise<unknown>) => void) | undefined;
  try {
    waitUntil = context.executionCtx.waitUntil.bind(context.executionCtx);
  } catch {
    // Node/test adapters have no Workers execution context.
  }
  return {
    session: resolved.session,
    /** Why session is null: missing bearer or verify failure code. Null when session ok. */
    authFailure: resolved.authFailure,
    waitUntil,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

type SessionResolve = {
  readonly session: AuthSession | null;
  readonly authFailure: TokenVerifyFailureCode | null;
};

async function resolveSession(authorization: string | null): Promise<SessionResolve> {
  const token = readBearerToken(authorization);
  if (!token) {
    return { session: null, authFailure: "missing_token" };
  }

  try {
    const resolved = resolveWorkOSVerifyEnv({
      WORKOS_API_KEY: env.WORKOS_API_KEY,
      WORKOS_CLIENT_ID: env.WORKOS_CLIENT_ID,
      WORKOS_TOKEN_AUDIENCE: env.WORKOS_TOKEN_AUDIENCE,
      WORKOS_TOKEN_ISSUER: env.WORKOS_TOKEN_ISSUER,
      WORKOS_AUTH_HOSTNAME: env.WORKOS_AUTH_HOSTNAME,
    });
    const session = await verifyAccessToken(token, {
      clientId: resolved.clientId,
      audience: resolved.audience,
      issuer: resolved.issuer,
      authHostname: resolved.authHostname ?? undefined,
    });
    return { session, authFailure: null };
  } catch (error) {
    // Console only: protectedProcedure UNAUTHORIZED has no data/header channel today.
    // WORKOS_API_KEY is required by resolveWorkOSVerifyEnv but unused by JWKS verify —
    // a refreshed API key does not change bearer JWT validation.
    const code =
      error instanceof TokenVerifyError ? error.code : ("verification_unavailable" as const);
    logTokenVerifyFailure(tokenVerifyFailureDiag(code, token));
    return { session: null, authFailure: code };
  }
}
