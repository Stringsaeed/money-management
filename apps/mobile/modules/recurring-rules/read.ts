import { max } from "date-fns";

import { dateAfter, nextScheduledDateOnOrAfter } from "@trove/domain/calendar";

import { parseDate, toDateString } from "@/utils/date";
import { listRules, loadRule } from "./persistence";
import type {
  CreateRecurringRulesOptions,
  RecurringRead,
  RecurringReadResult,
  RecurringUpcomingItem,
} from "./types";

export async function readRecurringRules(
  options: CreateRecurringRulesOptions,
  query: RecurringRead,
): Promise<RecurringReadResult> {
  if (query.kind === "detail") {
    return { kind: "detail", rule: await loadRule(options.database, query.ruleId) };
  }

  const rules = await listRules(options.database);
  if (query.kind === "list") {
    const filter = query.filter ?? "current";
    return {
      kind: "list",
      rules: rules.filter((rule) => {
        if (filter === "archived") return rule.lifecycle === "archived";
        if (filter === "needs_attention") return rule.health === "needs_attention";
        return rule.lifecycle !== "archived";
      }),
    };
  }

  const items: RecurringUpcomingItem[] = [];
  for (const rule of rules) {
    if (rule.lifecycle !== "active" || rule.health !== "ready") continue;
    if (rule.endCount !== null) {
      const count = await options.database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM recurring_occurrences WHERE rule_id = ?",
        rule.id,
      );
      if ((count?.count ?? 0) >= rule.endCount) continue;
    }
    const localDate = options.clock.localDate(rule.timeZone);
    const floor = max([parseDate(dateAfter(localDate)), parseDate(rule.eligibilityFloor)]);
    const scheduledDate = nextScheduledDateOnOrAfter(
      {
        startDate: rule.startDate,
        frequency: rule.frequency,
        intervalCount: rule.intervalCount,
        endDate: rule.endDate,
        endCount: null,
      },
      toDateString(floor),
    );
    if (scheduledDate) items.push({ rule, scheduledDate });
  }
  items.sort(
    (left, right) =>
      left.scheduledDate.localeCompare(right.scheduledDate) ||
      left.rule.name.localeCompare(right.rule.name),
  );
  return { kind: "upcoming", items: items.slice(0, query.limit ?? 3) };
}
