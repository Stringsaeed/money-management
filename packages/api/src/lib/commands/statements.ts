import type { SQL } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { sql } from "drizzle-orm";

import type { EffectTag } from "@trove/protocol";

import { commandResult, householdChange, pipelineAssertion } from "@trove/db/schema/commands";

import type { CommandDatabase } from "./types";

/** Anything drizzle can execute inside one atomic `batch()` — always a query builder, never bare SQL. */
export type BatchStatement = BatchItem<"sqlite">;

/**
 * Turns a guard expression into a statement that throws when the guard is
 * false: the CHECK constraint on `_pipeline_assertions.ok` fires, which aborts
 * and rolls back the entire batch — no partial application is observable.
 */
export function assertionStatement(db: CommandDatabase, guard: SQL): BatchStatement {
  const statement = db.insert(pipelineAssertion).values({
    id: crypto.randomUUID(),
    ok: sql`(SELECT CASE WHEN (${guard}) THEN 1 ELSE 0 END)`,
  });
  return statement as BatchStatement;
}

/** Appends one `household_changes` row with `seq = MAX(seq) + 1` for the household. */
export function changeLogStatement(
  db: CommandDatabase,
  input: {
    householdId: string;
    userId: string;
    commandId: string;
    effects: readonly EffectTag[];
  },
): BatchStatement {
  const statement = db.insert(householdChange).values({
    id: crypto.randomUUID(),
    householdId: input.householdId,
    userId: input.userId,
    commandId: input.commandId,
    effects: [...input.effects],
    seq: sql`(SELECT COALESCE(MAX(${householdChange.seq}), 0) + 1 FROM ${householdChange} WHERE ${householdChange.householdId} = ${input.householdId})`,
  });
  return statement as BatchStatement;
}

/** Stores the command's applied payload so retries replay instead of re-executing. */
export function resultStatement(
  db: CommandDatabase,
  input: { householdId: string; commandId: string; result: unknown },
): BatchStatement {
  const statement = db.insert(commandResult).values({
    householdId: input.householdId,
    commandId: input.commandId,
    result: input.result,
  });
  return statement as BatchStatement;
}

/**
 * Executes all statements as one atomic batch. Every statement is plain
 * sqlite-dialect query-builder SQL, so the pipeline runs unchanged against
 * D1 (production) or libsql (tests); D1 serializes batches per database.
 */
export async function executeBatch(
  db: CommandDatabase,
  statements: readonly BatchStatement[],
): Promise<void> {
  type BatchInput = Parameters<CommandDatabase["batch"]>[0];
  await db.batch(statements as unknown as BatchInput);
}
