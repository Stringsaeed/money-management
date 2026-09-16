import type { ViewStyle } from "react-native";

import { rawColorValues } from "@/lib/design-tokens";
import type { RecurringRule } from "@/modules/recurring-rules";

interface RecurringRuleAppearance {
  iconTintColor: string;
  surfaceStyle: ViewStyle;
}

const lifecycleAppearance: Record<RecurringRule["lifecycle"], RecurringRuleAppearance> = {
  active: {
    iconTintColor: rawColorValues.light.sage,
    surfaceStyle: { backgroundColor: `${rawColorValues.light.sage}1A` },
  },
  paused: {
    iconTintColor: rawColorValues.light.ink,
    surfaceStyle: { backgroundColor: rawColorValues.light.surfaceDim },
  },
  archived: {
    iconTintColor: rawColorValues.light.terracotta,
    surfaceStyle: { backgroundColor: `${rawColorValues.light.terracotta}1A` },
  },
  completed: {
    iconTintColor: rawColorValues.light.mutedForeground,
    surfaceStyle: { backgroundColor: rawColorValues.light.surfaceContainer },
  },
};

const attentionAppearance: RecurringRuleAppearance = {
  iconTintColor: rawColorValues.light.destructive,
  surfaceStyle: { backgroundColor: `${rawColorValues.light.terracotta}26` },
};

export function getRecurringRuleAppearance(rule: RecurringRule): RecurringRuleAppearance {
  if (rule.health === "needs_attention") return attentionAppearance;
  return lifecycleAppearance[rule.lifecycle];
}
