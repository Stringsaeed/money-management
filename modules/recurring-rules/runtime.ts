import { listRules, loadRule, runInTransaction } from "./persistence";
import { RecurringSettlementError, settleRule, settlementEffects } from "./settlement";
import type { CreateRecurringRulesOptions, SettlementReport } from "./types";

export async function settleRecurringRules(
  options: CreateRecurringRulesOptions,
): Promise<SettlementReport> {
  const startedAt = options.clock.now().toISOString();
  const rules = (await listRules(options.database)).filter((rule) => rule.lifecycle === "active");
  const reports: SettlementReport["rules"] = [];
  const causes: { ruleId: string; cause: unknown }[] = [];

  for (const listedRule of rules) {
    try {
      const result = await runInTransaction(options.database, async (transaction) => {
        const currentRule = await loadRule(transaction, listedRule.id);
        if (!currentRule) throw new Error(`Recurring Rule ${listedRule.id} disappeared.`);
        return settleRule(
          transaction,
          currentRule,
          options.clock.localDate(currentRule.timeZone),
          options.clock.now().toISOString(),
          options.identity,
          "increment",
        );
      });
      reports.push(result);
    } catch (cause) {
      const message = errorMessage(cause);
      causes.push({ ruleId: listedRule.id, cause });
      reports.push({
        ruleId: listedRule.id,
        kind: "failed",
        generatedCount: 0,
        totalMinor: 0,
        error: message,
      });
      const now = options.clock.now().toISOString();
      await options.database
        .runAsync(
          `UPDATE recurring_rules
           SET last_settlement_attempt_at = ?, last_settlement_error = ?, updated_at = ?
           WHERE id = ?`,
          now,
          message,
          now,
          listedRule.id,
        )
        .catch(() => undefined);
    }
  }

  const generatedCount = reports.reduce((total, report) => total + report.generatedCount, 0);
  const totalMinor = reports.reduce((total, report) => total + report.totalMinor, 0);
  const report: SettlementReport = {
    localDate:
      rules.length > 0
        ? options.clock.localDate(rules[0].timeZone)
        : options.clock.localDate(Intl.DateTimeFormat().resolvedOptions().timeZone),
    startedAt,
    finishedAt: options.clock.now().toISOString(),
    generatedCount,
    totalMinor,
    rules: reports,
    effects: settlementEffects(generatedCount),
  };
  if (causes.length > 0) throw new RecurringSettlementError(report, causes);
  return report;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Unknown Settlement failure";
}
