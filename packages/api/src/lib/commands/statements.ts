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
    /** Ledger whose `seq` watermark advances; the scope of record. */
    ledgerId: string;
    /** Household backing an organization Ledger; null for personal ones. */
    householdId?: string | null;
    userId: string;
    commandId: string;
    effects: readonly EffectTag[];
  },
): BatchStatement {
  const changeId = crypto.randomUUID();
  const effects = JSON.stringify(input.effects);
  const householdId = input.householdId ?? null;
  return {
    getSQL: () => sql`
      WITH next_sequence AS (
        INSERT INTO ${householdChangeSequence} (ledger_id, household_id, seq)
        VALUES (${input.ledgerId}, ${householdId}, 1)
        ON CONFLICT (ledger_id) DO UPDATE
        SET seq = ${householdChangeSequence.seq} + 1
        RETURNING seq
      )
      INSERT INTO ${householdChange} (id, ledger_id, household_id, seq, user_id, command_id, effects)
      SELECT ${changeId}, ${input.ledgerId}, ${householdId}, next_sequence.seq, ${input.userId}, ${input.commandId}, ${effects}::jsonb
      FROM next_sequence
    `,
  };
}

export function resultStatement(
  db: CommandDatabase,
  input: {
    ledgerId: string;
    householdId?: string | null;
    commandId: string;
    result: unknown;
  },
): BatchStatement {
  return db.insert(commandResult).values({
    ledgerId: input.ledgerId,
    householdId: input.householdId ?? null,
    commandId: input.commandId,
    result: input.result,
  });
}

export async function executeLedgerTransaction(
  db: CommandDatabase,
  statements: readonly BatchStatement[],
  ledgerId: string,
  options: { readonly lockLedger?: boolean } = {},
): Promise<void> {
  await db.transaction(async (tx) => {
    if (options.lockLedger !== false) {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${ledgerId}))`);
    }
    for (const statement of statements) {
      await tx.execute(statement.getSQL());
    }
  });
}
