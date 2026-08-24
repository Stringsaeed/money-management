import { createAuth } from "@trove/auth";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const session = await createAuth().api.getSession({
    headers: context.req.raw.headers,
  });
  let waitUntil: ((promise: Promise<unknown>) => void) | undefined;
  try {
    waitUntil = context.executionCtx.waitUntil.bind(context.executionCtx);
  } catch {
    // Node/test adapters have no Workers execution context.
  }
  return {
    auth: null,
    session,
    // Exposed so procedures can guard on request metadata (e.g. the
    // #88 settlement trigger's admin secret) without re-parsing Hono.
    headers: context.req.raw.headers,
    waitUntil,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
