import { ORPCError, os } from "@orpc/server";

import type { Context } from "./context";
import { logTokenVerifyFailure } from "./token-verify-diagnostics";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    const reason = context.authFailure ?? "no_session";
    // Missing bearer never reaches verifyAccessToken — log here so CF always
    // sees a stable code string (verify failures already logged in context).
    if (reason === "missing_token") {
      logTokenVerifyFailure({
        code: "missing_token",
        payloadDecoded: false,
        hasAud: false,
        hasClientId: false,
      });
    }
    throw new ORPCError("UNAUTHORIZED", {
      message: `Unauthorized (${reason})`,
    });
  }
  return next({
    context: {
      ...context,
      session: context.session,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);

export type { AppRouter, AppRouterClient } from "./routers";
