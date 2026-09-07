import type { SQL } from "drizzle-orm";
import { sql } from "drizzle-orm";

import type { EffectTag } from "@trove/protocol";

import {
  commandResult,
  householdChange,
  householdChangeSequence,
  pipelineAssertion,
} from "@trove/db/schema/commands";

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
  _db: CommandDatabase,
  input: {
    householdId: string;
    userId: string;
    commandId: string;
    effects: readonly EffectTag[];
  },
): BatchStatement {
  const changeId = crypto.randomUUID();
  const effects = JSON.stringify(input.effects);
  return {
    getSQL: () => sql`
      WITH next_sequence AS (
        INSERT INTO ${householdChangeSequence} (household_id, seq)
        VALUES (${input.householdId}, 1)
        ON CONFLICT (household_id) DO UPDATE
        SET seq = ${householdChangeSequence.seq} + 1
        RETURNING seq
      )
      INSERT INTO ${householdChange} (id, household_id, seq, user_id, command_id, effects)
      SELECT ${changeId}, ${input.householdId}, next_sequence.seq, ${input.userId}, ${input.commandId}, ${effects}::jsonb
      FROM next_sequence
    `,
  };
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
  options: { readonly lockHousehold?: boolean } = {},
): Promise<void> {
  await db.transaction(async (tx) => {
    if (options.lockHousehold !== false) {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${householdId}))`);
    }
    for (const statement of statements) {
      await tx.execute(statement.getSQL());
    }
  });
}
