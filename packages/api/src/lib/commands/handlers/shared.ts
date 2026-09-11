import type { z } from "zod";

import type { ValidationIssue } from "@trove/protocol";

import type { PlanContext } from "../pipeline";

/** Maps a zod failure onto the protocol's validation-issue shape. */
export function issuesFromZod(error: z.ZodError): readonly ValidationIssue[] {
  return error.issues.map((issue) => ({
    field: issue.path.map(String).join(".") || "(envelope)",
    message: issue.message,
  }));
}

/**
 * Optimistic-concurrency precondition check shared by every mutable-entity
 * handler (#86): compares the caller's `expectedVersion` against the loaded
 * row. Returns a typed rejection when stale, null otherwise.
 */
export function checkExpectedVersion(
  entity: { id: string; version: number },
  preconditions: readonly { expectedVersion?: number }[],
): {
  kind: "stale_version";
  entityId: string;
  expectedVersion: number;
  actualVersion: number;
} | null {
  const expectedVersion = preconditions.find(
    (p) => p.expectedVersion !== undefined,
  )?.expectedVersion;
  if (expectedVersion !== undefined && expectedVersion !== entity.version) {
    return {
      kind: "stale_version",
      entityId: entity.id,
      expectedVersion,
      actualVersion: entity.version,
    };
  }
  return null;
}

/** Dual-write columns every ledger-scoped budget/recurring row carries. */
export function scopeColumns(ctx: PlanContext) {
  return { ledgerId: ctx.ledgerId, householdId: ctx.householdId };
}
