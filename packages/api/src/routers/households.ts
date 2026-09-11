import type { HouseholdRole } from "@trove/protocol";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { createHouseholdDeps } from "../lib/households/deps";
import {
  createHousehold,
  deleteHousehold,
  getHousehold,
  inviteMember,
  leaveHousehold,
  listMyHouseholds,
  removeMember,
  renameHousehold,
  setMemberRole,
  startWidgetHandoff,
} from "../lib/households/service";
import { requireUserId } from "../lib/require-user";

const householdInput = z.object({ householdId: z.string().min(1) });
const roleInput = z.enum(["admin", "member", "viewer"]) satisfies z.ZodType<HouseholdRole>;

/**
 * Households are WorkOS Organizations. Every procedure here either issues a
 * WorkOS mutation and projects its result, or reads the Membership projection
 * after refreshing it when stale. Sign-in and personal sync never reach this
 * router; only an explicit create makes a Household.
 */
export const householdsRouter = {
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(80), requestId: z.string().uuid() }))
    .handler(({ context, input }) => {
      const { user } = context.session;
      return createHousehold(createHouseholdDeps(), {
        actor: { id: user.id, email: user.email, name: user.name },
        name: input.name,
        requestId: input.requestId,
      });
    }),

  listMine: protectedProcedure.handler(({ context }) => {
    const { user } = context.session;
    return listMyHouseholds(createHouseholdDeps(), {
      id: user.id,
      email: user.email,
      name: user.name,
    });
  }),

  get: protectedProcedure
    .input(householdInput)
    .handler(({ context, input }) =>
      getHousehold(createHouseholdDeps(), requireUserId(context), input.householdId),
    ),

  rename: protectedProcedure
    .input(householdInput.extend({ name: z.string().min(1).max(80) }))
    .handler(async ({ context, input }) => {
      await renameHousehold(createHouseholdDeps(), {
        userId: requireUserId(context),
        householdId: input.householdId,
        name: input.name,
      });
      return { ok: true } as const;
    }),

  invite: protectedProcedure
    .input(householdInput.extend({ email: z.string().email(), role: roleInput }))
    .handler(({ context, input }) =>
      inviteMember(createHouseholdDeps(), {
        userId: requireUserId(context),
        householdId: input.householdId,
        email: input.email,
        role: input.role,
      }),
    ),

  setMemberRole: protectedProcedure
    .input(householdInput.extend({ targetUserId: z.string().min(1), role: roleInput }))
    .handler(async ({ context, input }) => {
      await setMemberRole(createHouseholdDeps(), {
        userId: requireUserId(context),
        householdId: input.householdId,
        targetUserId: input.targetUserId,
        role: input.role,
      });
      return { ok: true } as const;
    }),

  removeMember: protectedProcedure
    .input(householdInput.extend({ targetUserId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      await removeMember(createHouseholdDeps(), {
        userId: requireUserId(context),
        householdId: input.householdId,
        targetUserId: input.targetUserId,
      });
      return { ok: true } as const;
    }),

  leave: protectedProcedure.input(householdInput).handler(async ({ context, input }) => {
    await leaveHousehold(createHouseholdDeps(), {
      userId: requireUserId(context),
      householdId: input.householdId,
    });
    return { ok: true } as const;
  }),

  delete: protectedProcedure.input(householdInput).handler(async ({ context, input }) => {
    await deleteHousehold(createHouseholdDeps(), {
      userId: requireUserId(context),
      householdId: input.householdId,
    });
    return { ok: true } as const;
  }),

  /** Admin-only: a single-use code the app hands to the member-management web page. */
  widgetHandoff: protectedProcedure.input(householdInput).handler(({ context, input }) =>
    startWidgetHandoff(createHouseholdDeps(), {
      userId: requireUserId(context),
      householdId: input.householdId,
    }),
  ),
};
