import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import type { ValidationIssue } from "@trove/protocol";
import { ledgerAccount } from "@trove/db/schema/ledger";

import type { CommandPlan, PlanContext, PlanRejection, PlanRequest } from "../pipeline";
import type { BatchStatement } from "../statements";
import { issuesFromZod } from "./shared";

/** Effect tags for structural Account writes: balances + summaries move. */
const ACCOUNT_EFFECTS = ["balances", "summaries"] as const;

export const createAccountPayloadSchema = z.object({
  /** Client-generated id (local-first); the server adopts it verbatim. */
  id: z.string().min(1).optional(),
  name: z.string().min(1).max(120),
  type: z.enum(["cash", "bank", "card"]),
  currency: z.string().min(3).max(3).default("USD"),
  color: z.string().min(1).max(32).default("#4A90D9"),
  icon: z.string().min(1).max(64).default("banknote.fill"),
  initialBalanceMinor: z.number().int().default(0),
  excludeFromTotal: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const updateAccountPayloadSchema = z.object({
  accountId: z.string().min(1),
  name: z.string().min(1).max(120).optional(),
  color: z.string().min(1).max(32).optional(),
  icon: z.string().min(1).max(64).optional(),
  excludeFromTotal: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const archiveAccountPayloadSchema = z.object({
  accountId: z.string().min(1),
});

type CreateAccountPayload = z.infer<typeof createAccountPayloadSchema>;
type UpdateAccountPayload = z.infer<typeof updateAccountPayloadSchema>;

async function loadAccount(
  ctx: PlanContext,
  accountId: string,
): Promise<typeof ledgerAccount.$inferSelect | null> {
  const rows = await ctx.db
    .select()
    .from(ledgerAccount)
    .where(and(eq(ledgerAccount.householdId, ctx.householdId), eq(ledgerAccount.id, accountId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Optimistic-concurrency guard shared by update/archive. */
function versionGuard(
  ctx: PlanContext,
  accountId: string,
  expectedVersion: number,
): ReturnType<typeof and> {
  return and(
    eq(ledgerAccount.householdId, ctx.householdId),
    eq(ledgerAccount.id, accountId),
    eq(ledgerAccount.version, expectedVersion),
  );
}

function resolveExpectedVersion(preconditions: PlanRequest["preconditions"]): number | undefined {
  return preconditions.find((p) => p.expectedVersion !== undefined)?.expectedVersion;
}

export const accountHandlers = {
  "account.create": {
    parsePayload(payload: unknown) {
      const result = createAccountPayloadSchema.safeParse(payload);
      return result.success
        ? { ok: true as const, value: result.data }
        : { ok: false as const, issues: issuesFromZod(result.error) };
    },

    async plan(ctx: PlanContext, { payload }: PlanRequest): Promise<CommandPlan | PlanRejection> {
      const input = payload as CreateAccountPayload;
      const accountId = input.id ?? crypto.randomUUID();

      if (await loadAccount(ctx, accountId)) {
        return { kind: "conflict", reason: "account_id_already_exists", current: { accountId } };
      }

      return {
        effects: [...ACCOUNT_EFFECTS],
        applied: { accountId, name: input.name, type: input.type, currency: input.currency },
        guards: [],
        statements: [
          ctx.db
            .insert(ledgerAccount)
            .values({
              householdId: ctx.householdId,
              id: accountId,
              name: input.name,
              type: input.type,
              currency: input.currency,
              color: input.color,
              icon: input.icon,
              initialBalanceMinor: input.initialBalanceMinor,
              excludeFromTotal: input.excludeFromTotal,
              sortOrder: input.sortOrder,
              createdBy: ctx.actorUserId,
              updatedBy: ctx.actorUserId,
            })
            .onConflictDoNothing() as unknown as BatchStatement,
        ],
      };
    },
  },

  "account.update": {
    parsePayload(payload: unknown) {
      const result = updateAccountPayloadSchema.safeParse(payload);
      return result.success
        ? { ok: true as const, value: result.data }
        : { ok: false as const, issues: issuesFromZod(result.error) };
    },

    async plan(
      ctx: PlanContext,
      { payload, preconditions }: PlanRequest,
    ): Promise<CommandPlan | PlanRejection> {
      const input = payload as UpdateAccountPayload;

      const existing = await loadAccount(ctx, input.accountId);
      if (!existing) {
        return {
          kind: "missing_entity",
          entityType: "account",
          entityId: input.accountId,
        } satisfies PlanRejection;
      }
      // Archived accounts stay editable? No — re-open is a deliberate act the
      // client performs via a dedicated flow; reject silent edits.
      if (existing.lifecycle === "archived") {
        return {
          kind: "invalid_intent",
          issues: [
            { field: "accountId", message: "Account is archived; restore it before editing." },
          ] satisfies readonly ValidationIssue[],
        };
      }

      const expectedVersion = resolveExpectedVersion(preconditions);
      if (expectedVersion !== undefined && expectedVersion !== existing.version) {
        return {
          kind: "stale_version",
          entityId: existing.id,
          expectedVersion,
          actualVersion: existing.version,
        };
      }
      const guardVersion = expectedVersion ?? existing.version;
      const rowGuard = versionGuard(ctx, existing.id, guardVersion);

      return {
        effects: [...ACCOUNT_EFFECTS],
        applied: { ...input },
        guards: [sql`(SELECT COUNT(*) FROM ${ledgerAccount} WHERE ${rowGuard}) = 1`],
        statements: [
          ctx.db
            .update(ledgerAccount)
            .set({
              ...(input.name !== undefined && { name: input.name }),
              ...(input.color !== undefined && { color: input.color }),
              ...(input.icon !== undefined && { icon: input.icon }),
              ...(input.excludeFromTotal !== undefined && {
                excludeFromTotal: input.excludeFromTotal,
              }),
              ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
              updatedBy: ctx.actorUserId,
              version: sql`${ledgerAccount.version} + 1`,
            })
            .where(rowGuard) as unknown as BatchStatement,
        ],
      };
    },
  },

  "account.archive": {
    parsePayload(payload: unknown) {
      const result = archiveAccountPayloadSchema.safeParse(payload);
      return result.success
        ? { ok: true as const, value: result.data }
        : { ok: false as const, issues: issuesFromZod(result.error) };
    },

    async plan(
      ctx: PlanContext,
      { payload, preconditions }: PlanRequest,
    ): Promise<CommandPlan | PlanRejection> {
      const input = payload as { accountId: string };

      const existing = await loadAccount(ctx, input.accountId);
      if (!existing) {
        return {
          kind: "missing_entity",
          entityType: "account",
          entityId: input.accountId,
        } satisfies PlanRejection;
      }
      if (existing.lifecycle === "archived") {
        return {
          kind: "invalid_intent",
          issues: [{ field: "accountId", message: "Account is already archived." }],
        };
      }

      const expectedVersion = resolveExpectedVersion(preconditions);
      if (expectedVersion !== undefined && expectedVersion !== existing.version) {
        return {
          kind: "stale_version",
          entityId: existing.id,
          expectedVersion,
          actualVersion: existing.version,
        };
      }
      const rowGuard = versionGuard(ctx, existing.id, expectedVersion ?? existing.version);

      return {
        effects: [...ACCOUNT_EFFECTS],
        applied: { accountId: existing.id, lifecycle: "archived" },
        guards: [sql`(SELECT COUNT(*) FROM ${ledgerAccount} WHERE ${rowGuard}) = 1`],
        statements: [
          ctx.db
            .update(ledgerAccount)
            .set({
              lifecycle: "archived",
              lifecycleChangedAt: new Date(),
              updatedBy: ctx.actorUserId,
              version: sql`${ledgerAccount.version} + 1`,
            })
            .where(rowGuard) as unknown as BatchStatement,
        ],
      };
    },
  },
};
