import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import type { PlanContext, PlanRejection, PlanRequest, CommandPlan } from "../pipeline";
import type { BatchStatement } from "../statements";
import { category } from "@trove/db/schema/ledger";

import { issuesFromZod } from "./shared";

/**
 * Effect tags for structural Category writes. Summaries re-aggregate;
 * historical category_mappings keep pointing at the id, so envelope
 * projections are untouched.
 */
const CATEGORY_EFFECTS = ["summaries"] as const;

export const createCategoryPayloadSchema = z.object({
  /** Client-generated id (local-first); the server adopts it verbatim. */
  id: z.string().min(1).optional(),
  name: z.string().min(1).max(120),
  type: z.enum(["income", "expense"]),
  color: z.string().min(1).max(32).default("#FF6B6B"),
  icon: z.string().min(1).max(64).default("🏷️"),
  parentId: z.string().min(1).nullable().default(null),
  sortOrder: z.number().int().default(0),
});

export const updateCategoryPayloadSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(120).optional(),
  color: z.string().min(1).max(32).optional(),
  icon: z.string().min(1).max(64).optional(),
  parentId: z.string().min(1).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const archiveCategoryPayloadSchema = z.object({
  categoryId: z.string().min(1),
});

type CreateCategoryPayload = z.infer<typeof createCategoryPayloadSchema>;
type UpdateCategoryPayload = z.infer<typeof updateCategoryPayloadSchema>;

async function loadCategory(
  ctx: PlanContext,
  categoryId: string,
): Promise<typeof category.$inferSelect | null> {
  const rows = await ctx.db
    .select()
    .from(category)
    .where(and(eq(category.householdId, ctx.householdId), eq(category.id, categoryId)))
    .limit(1);
  return rows[0] ?? null;
}

async function validateParent(
  ctx: PlanContext,
  parentId: string | null,
  selfId?: string,
): Promise<PlanRejection | null> {
  if (parentId === null) {
    return null;
  }
  if (selfId !== undefined && parentId === selfId) {
    return {
      kind: "invalid_intent",
      issues: [{ field: "parentId", message: "A category cannot be its own parent." }],
    };
  }
  const parent = await loadCategory(ctx, parentId);
  if (!parent) {
    return {
      kind: "missing_entity",
      entityType: "category",
      entityId: parentId,
    };
  }
  return null;
}

function versionGuard(ctx: PlanContext, categoryId: string, expectedVersion: number) {
  return and(
    eq(category.householdId, ctx.householdId),
    eq(category.id, categoryId),
    eq(category.version, expectedVersion),
  );
}

function checkVersion(
  existing: typeof category.$inferSelect,
  preconditions: PlanRequest["preconditions"],
): PlanRejection | null {
  const expectedVersion = preconditions.find(
    (p) => p.expectedVersion !== undefined,
  )?.expectedVersion;
  if (expectedVersion !== undefined && expectedVersion !== existing.version) {
    return {
      kind: "stale_version",
      entityId: existing.id,
      expectedVersion,
      actualVersion: existing.version,
    };
  }
  return null;
}

export const categoryHandlers = {
  "category.create": {
    parsePayload(payload: unknown) {
      const result = createCategoryPayloadSchema.safeParse(payload);
      return result.success
        ? { ok: true as const, value: result.data }
        : { ok: false as const, issues: issuesFromZod(result.error) };
    },

    async plan(ctx: PlanContext, { payload }: PlanRequest): Promise<CommandPlan | PlanRejection> {
      const input = payload as CreateCategoryPayload;
      const categoryId = input.id ?? crypto.randomUUID();

      if (await loadCategory(ctx, categoryId)) {
        return { kind: "conflict", reason: "category_id_already_exists", current: { categoryId } };
      }
      const parentIssue = await validateParent(ctx, input.parentId);
      if (parentIssue) {
        return parentIssue;
      }

      return {
        effects: [...CATEGORY_EFFECTS],
        applied: { categoryId, name: input.name, type: input.type },
        guards: [],
        statements: [
          ctx.db
            .insert(category)
            .values({
              householdId: ctx.householdId,
              id: categoryId,
              name: input.name,
              type: input.type,
              color: input.color,
              icon: input.icon,
              parentId: input.parentId,
              sortOrder: input.sortOrder,
              createdBy: ctx.actorUserId,
              updatedBy: ctx.actorUserId,
            })
            .onConflictDoNothing() as unknown as BatchStatement,
        ],
      };
    },
  },

  "category.update": {
    parsePayload(payload: unknown) {
      const result = updateCategoryPayloadSchema.safeParse(payload);
      return result.success
        ? { ok: true as const, value: result.data }
        : { ok: false as const, issues: issuesFromZod(result.error) };
    },

    async plan(
      ctx: PlanContext,
      { payload, preconditions }: PlanRequest,
    ): Promise<CommandPlan | PlanRejection> {
      const input = payload as UpdateCategoryPayload;

      const existing = await loadCategory(ctx, input.categoryId);
      if (!existing) {
        return { kind: "missing_entity", entityType: "category", entityId: input.categoryId };
      }
      if (existing.lifecycle === "archived") {
        return {
          kind: "invalid_intent",
          issues: [
            { field: "categoryId", message: "Category is archived; restore it before editing." },
          ],
        };
      }
      const versionIssue = checkVersion(existing, preconditions);
      if (versionIssue) {
        return versionIssue;
      }
      if (input.parentId !== undefined) {
        const parentIssue = await validateParent(ctx, input.parentId, existing.id);
        if (parentIssue) {
          return parentIssue;
        }
      }

      const rowGuard = versionGuard(ctx, existing.id, existing.version);

      return {
        effects: [...CATEGORY_EFFECTS],
        applied: { ...input },
        guards: [sql`(SELECT COUNT(*) FROM ${category} WHERE ${rowGuard}) = 1`],
        statements: [
          ctx.db
            .update(category)
            .set({
              ...(input.name !== undefined && { name: input.name }),
              ...(input.color !== undefined && { color: input.color }),
              ...(input.icon !== undefined && { icon: input.icon }),
              ...(input.parentId !== undefined && { parentId: input.parentId }),
              ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
              updatedBy: ctx.actorUserId,
              version: sql`${category.version} + 1`,
            })
            .where(rowGuard) as unknown as BatchStatement,
        ],
      };
    },
  },

  "category.archive": {
    parsePayload(payload: unknown) {
      const result = archiveCategoryPayloadSchema.safeParse(payload);
      return result.success
        ? { ok: true as const, value: result.data }
        : { ok: false as const, issues: issuesFromZod(result.error) };
    },

    async plan(
      ctx: PlanContext,
      { payload, preconditions }: PlanRequest,
    ): Promise<CommandPlan | PlanRejection> {
      const input = payload as { categoryId: string };

      const existing = await loadCategory(ctx, input.categoryId);
      if (!existing) {
        return { kind: "missing_entity", entityType: "category", entityId: input.categoryId };
      }
      if (existing.lifecycle === "archived") {
        return {
          kind: "invalid_intent",
          issues: [{ field: "categoryId", message: "Category is already archived." }],
        };
      }
      const versionIssue = checkVersion(existing, preconditions);
      if (versionIssue) {
        return versionIssue;
      }

      const rowGuard = versionGuard(ctx, existing.id, existing.version);

      return {
        effects: [...CATEGORY_EFFECTS],
        applied: { categoryId: existing.id, lifecycle: "archived" },
        guards: [sql`(SELECT COUNT(*) FROM ${category} WHERE ${rowGuard}) = 1`],
        statements: [
          ctx.db
            .update(category)
            .set({
              lifecycle: "archived",
              lifecycleChangedAt: new Date(),
              updatedBy: ctx.actorUserId,
              version: sql`${category.version} + 1`,
            })
            .where(rowGuard) as unknown as BatchStatement,
        ],
      };
    },
  },
};
