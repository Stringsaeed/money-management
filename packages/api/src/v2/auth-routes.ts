import { Hono, type Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";

import {
  claimGuestSession,
  ensureV2UserIdentity,
  guestTokenFromAuthorization,
  issueGuestSession,
  principalFromWorkOSBearer,
  requireUserPrincipal,
  resolveGuestPrincipal,
  revokeGuestSession,
  type V2AuthDeps,
  type V2Principal,
  type V2UserPrincipal,
  type WorkOSVerifierConfig,
  V2AuthError,
  v2AuthErrorResponse,
} from "./auth";

export interface V2AuthRoutesDeps extends V2AuthDeps {
  readonly workos: WorkOSVerifierConfig;
  readonly resolveUser?: (
    authorization: string | null,
    config: WorkOSVerifierConfig,
  ) => Promise<V2UserPrincipal>;
}

const claimInput = z.object({ guestToken: z.string().min(1).max(512) });

function clientKey(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("user-agent") ??
    "unknown"
  );
}

function userResponse(principal: V2UserPrincipal) {
  return {
    kind: "signed_in" as const,
    user: {
      userId: principal.userId,
      workosUserId: principal.workosUserId,
      email: principal.email,
      name: principal.name,
    },
  };
}

// oxlint-disable-next-line anti-slop/no-unknown-parameters
function respondError(context: Context, error: unknown) {
  const result = v2AuthErrorResponse(error);
  // SAFETY: V2AuthError status values are all valid Hono content statuses.
  return context.json(result.body, result.status as ContentfulStatusCode);
}

async function parseBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new V2AuthError({
      status: 400,
      code: "invalid_json",
      message: "Request body must be valid JSON.",
    });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new V2AuthError({
      status: 400,
      code: "invalid_request",
      message: "Request fields are invalid.",
    });
  }
  return parsed.data;
}

export function createV2AuthRoutes(deps: V2AuthRoutesDeps): Hono {
  const routes = new Hono();

  const resolveUser = (authorization: string | null) =>
    (deps.resolveUser ?? principalFromWorkOSBearer)(authorization, deps.workos);

  routes.post("/guest", async (context) => {
    try {
      const issued = await issueGuestSession(deps, { clientKey: clientKey(context.req.raw) });
      return context.json({
        session: {
          kind: "guest" as const,
          guestSessionId: issued.principal.guestSessionId,
          token: issued.token,
          expiresAt: issued.expiresAt.toISOString(),
        },
      });
    } catch (error) {
      return respondError(context, error);
    }
  });

  routes.get("/session", async (context) => {
    try {
      const authorization = context.req.raw.headers.get("Authorization");
      const token = guestTokenFromAuthorization(
        authorization,
        context.req.raw.headers.get("X-Trove-Guest-Token"),
      );
      if (token) {
        const principal = await resolveGuestPrincipal(deps, token);
        return context.json({
          session: { kind: "guest" as const, guestSessionId: principal.guestSessionId },
        });
      }
      const principal = await resolveUser(authorization);
      await ensureV2UserIdentity(deps.db, principal, deps.now?.() ?? new Date());
      return context.json({ session: userResponse(principal) });
    } catch (error) {
      return respondError(context, error);
    }
  });

  routes.post("/claim", async (context) => {
    try {
      const input = await parseBody(context.req.raw, claimInput);
      const principal = await resolveUser(context.req.raw.headers.get("Authorization"));
      const claimed = await claimGuestSession(deps, { token: input.guestToken, user: principal });
      return context.json({
        status: claimed.status,
        guestSessionId: claimed.guestSessionId,
        user: userResponse(principal).user,
      });
    } catch (error) {
      return respondError(context, error);
    }
  });

  routes.post("/revoke", async (context) => {
    try {
      const token = guestTokenFromAuthorization(
        context.req.raw.headers.get("Authorization"),
        context.req.raw.headers.get("X-Trove-Guest-Token"),
      );
      if (!token) {
        throw new V2AuthError({
          status: 400,
          code: "guest_token_required",
          message: "Guest token is required.",
        });
      }
      await revokeGuestSession(deps, token);
      return context.json({ ok: true as const });
    } catch (error) {
      return respondError(context, error);
    }
  });

  return routes;
}

export async function resolveV2Principal(
  request: Request,
  deps: V2AuthRoutesDeps,
): Promise<V2Principal> {
  const token = guestTokenFromAuthorization(
    request.headers.get("Authorization"),
    request.headers.get("X-Trove-Guest-Token"),
  );
  if (token) return resolveGuestPrincipal(deps, token);
  return (deps.resolveUser ?? principalFromWorkOSBearer)(
    request.headers.get("Authorization"),
    deps.workos,
  );
}

export async function resolveV2User(
  request: Request,
  deps: V2AuthRoutesDeps,
): Promise<V2UserPrincipal> {
  return requireUserPrincipal(await resolveV2Principal(request, deps));
}
