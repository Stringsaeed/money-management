import type { SQL } from "drizzle-orm";
import { sql } from "drizzle-orm";

import type { EffectTag } from "@trove/protocol";

import { commandResult, householdChange, pipelineAssertion } from "@trove/db/schema/commands";

import type { CommandDatabase } from "./types";

export type BatchStatement = {
  getSQL(): SQL;
};

export function assertionStatement(db: CommandDatabase, guard: SQL): BatchStatement {
  return db.insert(pipelineAssertion).values({
    id: crypto.randomUUID(),
    ok: sql`(SELECT CASE WHEN (${guard}) THEN 1 ELSE 0 END)`,
  });
}

export function changeLogStatement(
  db: CommandDatabase,
  input: {
    householdId: string;
    userId: string;
    commandId: string;
    effects: readonly EffectTag[];
  },
): BatchStatement {
  return db.insert(householdChange).values({
    id: crypto.randomUUID(),
    householdId: input.householdId,
    userId: input.userId,
    commandId: input.commandId,
    effects: [...input.effects],
    seq: sql`(SELECT COALESCE(MAX(${householdChange.seq}), 0) + 1 FROM ${householdChange} WHERE ${householdChange.householdId} = ${input.householdId})`,
  });
}

export function resultStatement(
  db: CommandDatabase,
  input: { householdId: string; commandId: string; result: unknown },
): BatchStatement {
  return db.insert(commandResult).values({
    householdId: input.householdId,
    commandId: input.commandId,
    result: input.result,
  });
}

export async function executeHouseholdTransaction(
  db: CommandDatabase,
  statements: readonly BatchStatement[],
  householdId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${householdId}))`);
    for (const statement of statements) {
      await tx.execute(statement.getSQL());
    }
  });
}
