import type { V2RecurringRule } from "@trove/api/v2/contracts";

import type { IconName } from "@/ui/trove";

export const RECURRING_KIND_ICONS = {
  income: "income",
  expense: "expense",
  transfer: "transfer",
} as const satisfies Record<V2RecurringRule["kind"], IconName>;

/** Signed minor units for `Amount`: spending negative, income positive, transfers unsigned. */
export function recurringAmount(rule: V2RecurringRule) {
  return {
    minor: rule.kind === "expense" ? -rule.amountMinor : rule.amountMinor,
    signDisplay: rule.kind === "transfer" ? ("never" as const) : ("always" as const),
  };
}

export function recurringSubtitle(rule: V2RecurringRule): string {
  const parts = [`${rule.frequency} · every ${rule.intervalCount}`, rule.lifecycle];
  if (rule.health === "needs_attention") parts.push("Needs attention");
  return parts.join(" · ");
}
