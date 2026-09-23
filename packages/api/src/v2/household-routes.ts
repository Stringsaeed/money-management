import { Hono, type Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";

import {
  V2AuthError,
  requireUserPrincipal,
  v2AuthErrorResponse,
  type V2UserPrincipal,
} from "./auth";
import {
  createV2Household,
  getV2Household,
  inviteV2Member,
  leaveV2Household,
  listV2Households,
  setV2MemberRole,
  type V2HouseholdDeps,
} from "./households";
import { resolveV2Principal, type V2AuthRoutesDeps } from "./auth-routes";

export interface V2HouseholdRoutesDeps extends V2HouseholdDeps, V2AuthRoutesDeps {}

const roleSchema = z.enum(["admin", "member", "viewer"]);
const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  requestId: z.string().uuid(),
});
const inviteSchema = z.object({ email: z.string().email(), role: roleSchema.default("member") });
const roleInput = z.object({ role: roleSchema });

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

function actor(principal: V2UserPrincipal): V2UserPrincipal {
  return principal;
}

export function createV2HouseholdRoutes(deps: V2HouseholdRoutesDeps): Hono {
  const routes = new Hono();

  async function requireUser(request: Request): Promise<V2UserPrincipal> {
    return requireUserPrincipal(await resolveV2Principal(request, deps));
  }

  routes.get("/", async (context) => {
    try {
      return context.json({
        households: await listV2Households(deps, await requireUser(context.req.raw)),
      });
    } catch (error) {
      return respondError(context, error);
    }
  });

  routes.post("/", async (context) => {
    try {
      const input = await parseBody(context.req.raw, createSchema);
      const user = await requireUser(context.req.raw);
      return context.json(await createV2Household(deps, { actor: actor(user), ...input }), 201);
    } catch (error) {
      return respondError(context, error);
    }
  });

  routes.get("/:householdId", async (context) => {
    try {
      const user = await requireUser(context.req.raw);
      return context.json(
        await getV2Household(deps, {
          userId: user.userId,
          householdId: context.req.param("householdId"),
        }),
      );
    } catch (error) {
      return respondError(context, error);
    }
  });

  routes.post("/:householdId/invites", async (context) => {
    try {
      const input = await parseBody(context.req.raw, inviteSchema);
      const user = await requireUser(context.req.raw);
      return context.json(
        await inviteV2Member(deps, {
          userId: user.userId,
          householdId: context.req.param("householdId"),
          email: input.email,
          role: input.role,
        }),
        201,
      );
    } catch (error) {
      return respondError(context, error);
    }
  });

  routes.post("/:householdId/leave", async (context) => {
    try {
      const user = await requireUser(context.req.raw);
      await leaveV2Household(deps, {
        userId: user.userId,
        householdId: context.req.param("householdId"),
      });
      return context.json({ ok: true as const });
    } catch (error) {
      return respondError(context, error);
    }
  });

  routes.post("/:householdId/members/:userId/role", async (context) => {
    try {
      const input = await parseBody(context.req.raw, roleInput);
      const user = await requireUser(context.req.raw);
      await setV2MemberRole(deps, {
        userId: user.userId,
        householdId: context.req.param("householdId"),
        targetUserId: context.req.param("userId"),
        role: input.role,
      });
      return context.json({ ok: true as const });
    } catch (error) {
      return respondError(context, error);
    }
  });

  return routes;
}
