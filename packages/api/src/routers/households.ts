import { ORPCError } from "@orpc/server";
import { createDb } from "@trove/db";
import { user } from "@trove/db/schema/auth";
import { household, inviteCode, membership } from "@trove/db/schema/household";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import {
  DEFAULT_INVITE_EXPIRY_DAYS,
  MAX_INVITE_EXPIRY_DAYS,
  buildInviteCode,
  canLeaveHousehold,
  canRemoveMember,
  canTransferOwnership,
  isValidInviteExpiryDays,
} from "../lib/household-rules";
import { protectedProcedure } from "../index";
import { requireUserId } from "../lib/require-user";

async function requireMembership(
  db: ReturnType<typeof createDb>,
  userId: string,
  householdId: string,
) {
  const rows = await db
    .select()
    .from(membership)
    .where(and(eq(membership.userId, userId), eq(membership.householdId, householdId)))
    .limit(1);
  const row = rows[0];
  if (!row) {
    throw new ORPCError("NOT_FOUND", { message: "You are not a member of this household." });
  }
  return row;
}

async function requireOwner(db: ReturnType<typeof createDb>, userId: string, householdId: string) {
  const row = await requireMembership(db, userId, householdId);
  if (row.role !== "owner") {
    throw new ORPCError("FORBIDDEN", { message: "Only the household owner can do that." });
  }
  return row;
}

/** Deactivates every other active membership so the user has exactly one current household. */
async function activateMembership(
  db: ReturnType<typeof createDb>,
  userId: string,
  householdId: string,
) {
  await db.update(membership).set({ isActive: false }).where(eq(membership.userId, userId));
  await db
    .update(membership)
    .set({ isActive: true })
    .where(and(eq(membership.userId, userId), eq(membership.householdId, householdId)));
}

export const householdsRouter = {
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(80) }))
    .handler(async ({ context, input }) => {
      const userId = requireUserId(context);
      const db = createDb();
      const id = crypto.randomUUID();
      await db.insert(household).values({
        id,
        name: input.name.trim(),
        createdByUserId: userId,
      });
      await db.insert(membership).values({
        id: crypto.randomUUID(),
        userId,
        householdId: id,
        role: "owner",
        isActive: true,
      });
      return { householdId: id };
    }),

  listMine: protectedProcedure.handler(async ({ context }) => {
    const userId = requireUserId(context);
    const db = createDb();
    return db
      .select({
        householdId: household.id,
        name: household.name,
        role: membership.role,
        isActive: membership.isActive,
        createdAt: household.createdAt,
      })
      .from(membership)
      .innerJoin(household, eq(household.id, membership.householdId))
      .where(eq(membership.userId, userId));
  }),

  get: protectedProcedure
    .input(z.object({ householdId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const userId = requireUserId(context);
      const db = createDb();
      await requireMembership(db, userId, input.householdId);
      const rows = await db
        .select()
        .from(household)
        .where(eq(household.id, input.householdId))
        .limit(1);
      const found = rows[0];
      if (!found) {
        throw new ORPCError("NOT_FOUND", { message: "Household not found." });
      }
      const members = await db
        .select({
          userId: membership.userId,
          role: membership.role,
          isActive: membership.isActive,
          joinedAt: membership.createdAt,
          userName: user.name,
          userEmail: user.email,
        })
        .from(membership)
        .innerJoin(user, eq(user.id, membership.userId))
        .where(eq(membership.householdId, input.householdId));

      return {
        householdId: found.id,
        name: found.name,
        createdByUserId: found.createdByUserId,
        createdAt: found.createdAt,
        members: members.map((m) => ({
          userId: m.userId,
          userName: m.userName,
          userEmail: m.userEmail,
          role: m.role as "owner" | "member",
          isActive: m.isActive,
          joinedAt: m.joinedAt,
        })),
      };
    }),

  rename: protectedProcedure
    .input(z.object({ householdId: z.string().min(1), name: z.string().min(1).max(80) }))
    .handler(async ({ context, input }) => {
      const userId = requireUserId(context);
      const db = createDb();
      await requireOwner(db, userId, input.householdId);
      await db
        .update(household)
        .set({ name: input.name.trim() })
        .where(eq(household.id, input.householdId));
      return { ok: true };
    }),

  setActive: protectedProcedure
    .input(z.object({ householdId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const userId = requireUserId(context);
      const db = createDb();
      await requireMembership(db, userId, input.householdId);
      await activateMembership(db, userId, input.householdId);
      return { ok: true };
    }),

  generateInvite: protectedProcedure
    .input(
      z.object({
        householdId: z.string().min(1),
        expiresInDays: z
          .number()
          .int()
          .min(1)
          .max(MAX_INVITE_EXPIRY_DAYS)
          .default(DEFAULT_INVITE_EXPIRY_DAYS),
        singleUse: z.boolean().default(true),
      }),
    )
    .handler(async ({ context, input }) => {
      const userId = requireUserId(context);
      const db = createDb();
      if (!isValidInviteExpiryDays(input.expiresInDays)) {
        throw new ORPCError("BAD_REQUEST", {
          message: `Invite expiry must be between 1 and ${MAX_INVITE_EXPIRY_DAYS} days.`,
        });
      }
      await requireOwner(db, userId, input.householdId);
      const expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000);
      const id = crypto.randomUUID();

      let code = buildInviteCode(() => Math.random());
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          await db.insert(inviteCode).values({
            id,
            code,
            householdId: input.householdId,
            createdByUserId: userId,
            expiresAt,
            singleUse: input.singleUse,
          });
          return { inviteId: id, code, expiresAt };
        } catch {
          code = buildInviteCode(() => Math.random());
        }
      }
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Could not generate a unique invite code. Try again.",
      });
    }),

  listInvites: protectedProcedure
    .input(z.object({ householdId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const userId = requireUserId(context);
      const db = createDb();
      await requireOwner(db, userId, input.householdId);
      return db
        .select({
          inviteId: inviteCode.id,
          code: inviteCode.code,
          expiresAt: inviteCode.expiresAt,
          singleUse: inviteCode.singleUse,
          usedByUserId: inviteCode.usedByUserId,
          createdAt: inviteCode.createdAt,
        })
        .from(inviteCode)
        .where(
          and(
            eq(inviteCode.householdId, input.householdId),
            isNull(inviteCode.revokedAt),
            gt(inviteCode.expiresAt, new Date()),
          ),
        );
    }),

  revokeInvite: protectedProcedure
    .input(z.object({ inviteId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const userId = requireUserId(context);
      const db = createDb();
      const rows = await db
        .select()
        .from(inviteCode)
        .where(eq(inviteCode.id, input.inviteId))
        .limit(1);
      const invite = rows[0];
      if (!invite) {
        throw new ORPCError("NOT_FOUND", { message: "Invite not found." });
      }
      await requireOwner(db, userId, invite.householdId);
      await db
        .update(inviteCode)
        .set({ revokedAt: new Date() })
        .where(eq(inviteCode.id, invite.id));
      return { ok: true };
    }),

  acceptInvite: protectedProcedure
    .input(z.object({ code: z.string().min(1).max(16) }))
    .handler(async ({ context, input }) => {
      const userId = requireUserId(context);
      const db = createDb();
      const code = input.code.trim().toUpperCase();
      const rows = await db.select().from(inviteCode).where(eq(inviteCode.code, code)).limit(1);
      const invite = rows[0];
      if (!invite || invite.revokedAt !== null) {
        throw new ORPCError("NOT_FOUND", { message: "That invite code is invalid." });
      }
      if (invite.expiresAt.getTime() < Date.now()) {
        throw new ORPCError("BAD_REQUEST", { message: "That invite code has expired." });
      }
      if (invite.singleUse && invite.usedByUserId !== null) {
        throw new ORPCError("BAD_REQUEST", { message: "That invite code has already been used." });
      }
      const existing = await db
        .select()
        .from(membership)
        .where(and(eq(membership.userId, userId), eq(membership.householdId, invite.householdId)))
        .limit(1);
      if (existing[0]) {
        await activateMembership(db, userId, invite.householdId);
        return { householdId: invite.householdId };
      }
      await db.insert(membership).values({
        id: crypto.randomUUID(),
        userId,
        householdId: invite.householdId,
        role: "member",
        isActive: true,
      });
      await activateMembership(db, userId, invite.householdId);
      if (invite.singleUse) {
        await db
          .update(inviteCode)
          .set({ usedByUserId: userId })
          .where(eq(inviteCode.id, invite.id));
      }
      return { householdId: invite.householdId };
    }),

  leave: protectedProcedure
    .input(z.object({ householdId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const userId = requireUserId(context);
      const db = createDb();
      const row = await requireMembership(db, userId, input.householdId);
      if (!canLeaveHousehold(row.role as "owner" | "member")) {
        throw new ORPCError("FORBIDDEN", {
          message: "Owners must transfer ownership or delete the household before leaving.",
        });
      }
      await db.delete(membership).where(eq(membership.id, row.id));
      return { ok: true };
    }),

  removeMember: protectedProcedure
    .input(z.object({ householdId: z.string().min(1), userId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const actorId = requireUserId(context);
      const db = createDb();
      const actor = await requireOwner(db, actorId, input.householdId);
      const targetRows = await db
        .select()
        .from(membership)
        .where(
          and(eq(membership.userId, input.userId), eq(membership.householdId, input.householdId)),
        )
        .limit(1);
      const target = targetRows[0];
      if (!target) {
        throw new ORPCError("NOT_FOUND", { message: "That user is not a household member." });
      }
      const allowed = canRemoveMember(
        actor.role as "owner" | "member",
        target.role as "owner" | "member",
        actorId === input.userId,
      );
      if (!allowed) {
        throw new ORPCError("FORBIDDEN", {
          message: "Owners cannot remove themselves or other owners.",
        });
      }
      await db.delete(membership).where(eq(membership.id, target.id));
      return { ok: true };
    }),

  transferOwnership: protectedProcedure
    .input(z.object({ householdId: z.string().min(1), userId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const actorId = requireUserId(context);
      const db = createDb();
      const actor = await requireOwner(db, actorId, input.householdId);
      const targetRows = await db
        .select()
        .from(membership)
        .where(
          and(eq(membership.userId, input.userId), eq(membership.householdId, input.householdId)),
        )
        .limit(1);
      const target = targetRows[0];
      const allowed = canTransferOwnership(
        actor.role as "owner" | "member",
        Boolean(target),
        actorId === input.userId,
      );
      if (!allowed) {
        throw new ORPCError("FORBIDDEN", {
          message: "Ownership can only be transferred to another member.",
        });
      }
      await db
        .update(membership)
        .set({ role: "member", version: sql`${membership.version} + 1` })
        .where(eq(membership.id, actor.id));
      await db
        .update(membership)
        .set({ role: "owner", version: sql`${membership.version} + 1` })
        .where(eq(membership.id, target!.id));
      return { ok: true };
    }),

  delete: protectedProcedure
    .input(z.object({ householdId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const userId = requireUserId(context);
      const db = createDb();
      await requireOwner(db, userId, input.householdId);
      await db.delete(household).where(eq(household.id, input.householdId));
      return { ok: true };
    }),
};
