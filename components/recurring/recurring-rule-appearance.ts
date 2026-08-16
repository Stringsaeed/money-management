import type { RecurringRule } from "@/modules/recurring-rules";

interface RecurringRuleAppearance {
  iconTintColor: string;
  surfaceClassName: string;
}

const lifecycleAppearance: Record<RecurringRule["lifecycle"], RecurringRuleAppearance> = {
  active: {
    iconTintColor: "#4A8F69",
    surfaceClassName: "bg-sage/10",
  },
  paused: {
    iconTintColor: "#2C5F47",
    surfaceClassName: "bg-surface-dim",
  },
  archived: {
    iconTintColor: "#D46A4C",
    surfaceClassName: "bg-terracotta/10",
  },
  completed: {
    iconTintColor: "#6E8A7C",
    surfaceClassName: "bg-surface-container",
  },
};

const attentionAppearance: RecurringRuleAppearance = {
  iconTintColor: "#C4452F",
  surfaceClassName: "bg-terracotta/15",
};

export function getRecurringRuleAppearance(rule: RecurringRule): RecurringRuleAppearance {
  if (rule.health === "needs_attention") return attentionAppearance;
  return lifecycleAppearance[rule.lifecycle];
}
