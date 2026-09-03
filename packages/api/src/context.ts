import type { createAuth } from "@trove/auth";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
  auth: ReturnType<typeof createAuth>;
};

export async function createContext({ context, auth }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
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
