import { and, asc, eq, ne, sql } from "drizzle-orm";

import type { RuleSettlementCommit, SettlementStore } from "@trove/domain/settlement";
import { settlementEffects } from "@trove/domain/settlement";

import { recurringOccurrence, recurringRule } from "@trove/db/schema/recurring";
import { ledgerAccount, transaction } from "@trove/db/schema/ledger";

import {
  assertionStatement,
  changeLogStatement,
  executeLedgerTransaction,
  resultStatement,
  type BatchStatement,
} from "../commands/statements";
import type { CommandDatabase } from "../commands/types";

export { settlementEffects };

export interface RecurringScope {
  /** Real ledger id: `personal:<userId>` or the organization/Household id. */
  readonly ledgerId: string;
  /** Household backing an organization Ledger; null on a Personal Ledger. */
  readonly householdId: string | null;
  readonly userId: string;
}

export class PgRecurringStore implements SettlementStore {
  constructor(
    private readonly db: CommandDatabase,
    private readonly scope: RecurringScope,
    private readonly nextTransactionId: () => string,
  ) {}

  async getAccountCurrency(accountId: string): Promise<string | null> {
    const rows = await this.db
      .select({ currency: ledgerAccount.currency })
      .from(ledgerAccount)
      .where(and(eq(ledgerAccount.ledgerId, this.scope.ledgerId), eq(ledgerAccount.id, accountId)))
      .limit(1);
    return rows[0]?.currency ?? null;
  }

  async getSettledDates(ruleId: string): Promise<string[]> {
    const rows = await this.db
      .select({ scheduledDate: recurringOccurrence.scheduledDate })
      .from(recurringOccurrence)
      .where(
        and(
          eq(recurringOccurrence.ledgerId, this.scope.ledgerId),
          eq(recurringOccurrence.ruleId, ruleId),
        ),
      );
    return rows.map((r) => r.scheduledDate).sort();
  }

  async commitRuleSettlement(commit: RuleSettlementCommit): Promise<void> {
    const now = new Date(commit.now);
    const statements: BatchStatement[] = [
      assertionStatement(
        this.db,
        sql`(SELECT COUNT(*) FROM ${recurringRule}
             WHERE ${recurringRule.ledgerId} = ${this.scope.ledgerId}
               AND ${recurringRule.id} = ${commit.ruleId}
               AND ${recurringRule.revision} = ${commit.expectedRevision}) = 1`,
      ),
    ];

    for (const generated of commit.generated) {
      statements.push(
        this.db.insert(transaction).values({
          ledgerId: this.scope.ledgerId,
          householdId: this.scope.householdId,
          id: generated.transactionId,
          type: generated.type,
          amountMinor: generated.amountMinor,
          currency: generated.currency,
          date: generated.date,
          accountId: generated.accountId as string,
          toAccountId: generated.toAccountId,
          categoryId: generated.categoryId,
          isRecurring: true,
          recurringRuleId: commit.ruleId,
          description: generated.description,
          createdBy: this.scope.userId,
          updatedBy: this.scope.userId,
        }),
      );
      statements.push(
        this.db.insert(recurringOccurrence).values({
          id: this.nextTransactionId(),
          ledgerId: this.scope.ledgerId,
          householdId: this.scope.householdId,
          ruleId: commit.ruleId,
          scheduledDate: generated.date,
          transactionId: generated.transactionId,
          settledAt: now,
        }),
      );
    }

    statements.push(
      this.db
        .update(recurringRule)
        .set({
          ...(commit.lifecycleChanged && {
            lifecycle: commit.lifecycle,
            lifecycleChangedAt: now,
          }),
          revision: commit.nextRevision,
          health: commit.health,
          attentionReasons: commit.attentionReasonsJson ?? "[]",
          ...(commit.health === "needs_attention" && { healthChangedAt: now }),
          lastSettlementAttemptAt: now,
          lastSettlementError: null,
          updatedBy: this.scope.userId,
        })
        .where(
          and(eq(recurringRule.ledgerId, this.scope.ledgerId), eq(recurringRule.id, commit.ruleId)),
        ),
    );

    if (commit.generated.length > 0) {
      const commandId = `settlement:${commit.ruleId}:${commit.generated[0]?.transactionId ?? ""}`;
      statements.push(
        changeLogStatement(this.db, {
          ledgerId: this.scope.ledgerId,
          householdId: this.scope.householdId,
          userId: this.scope.userId,
          commandId,
          effects: settlementEffects(commit.generated.length),
        }),
      );
      statements.push(
        resultStatement(this.db, {
          ledgerId: this.scope.ledgerId,
          householdId: this.scope.householdId,
          commandId,
          result: { generatedCount: commit.generated.length },
        }),
      );
    }

    await executeLedgerTransaction(this.db, statements, this.scope.ledgerId);
  }
}

export async function listSettleableRules(db: CommandDatabase, ledgerId: string) {
  return db
    .select()
    .from(recurringRule)
    .where(and(eq(recurringRule.ledgerId, ledgerId), ne(recurringRule.lifecycle, "archived")))
    .orderBy(asc(recurringRule.name), asc(recurringRule.id));
}
