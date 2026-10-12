import { StyleSheet } from "react-native";
import { EaseView } from "react-native-ease";

import type { V2Category, V2EnvelopeTotals } from "@trove/api/v2/contracts";

import { useReducedMotion } from "@/ui/motion";
import { compactAmount, ImpactLine, motion, troveTransition } from "@/ui/trove";
import { parseMoneyMinor } from "@/utils/money";

import { categoriesById, envelopeEmoji } from "../envelope-emoji";
import { GROUP_EMOJI, GROUP_ORDER } from "../envelope-groups";
import type { EnvelopeLine } from "../home/home-model";

import { adjustImpact } from "./adjust-impact";
import { PlanAdjustGroup } from "./plan-adjust-group";
import type { PlanAdjust } from "./use-plan-adjust";

interface PlanAdjustSectionProps {
  readonly adjust: PlanAdjust;
  readonly currency: string;
  readonly categories: readonly V2Category[];
  /** Last month's totals, for the hints; `null` when unknown. */
  readonly previous: readonly V2EnvelopeTotals[] | null;
}

/** Adjust amounts: every envelope's plan to type, by group, and what stays to plan. */
export function PlanAdjustSection({
  adjust,
  currency,
  categories,
  previous,
}: PlanAdjustSectionProps) {
  const reducedMotion = useReducedMotion();
  const categoryLookup = categoriesById(categories);
  const lastMonth = new Map(previous?.map((totals) => [totals.id, totals.budgetedMinor]));
  const impact = adjustImpact(adjust.result, currency);
  const typedMinor = (line: EnvelopeLine) =>
    Math.max(parseMoneyMinor(adjust.valueOf(line) || "0", currency) ?? 0, 0);

  return (
    <EaseView
      animate={{ opacity: 1 }}
      initialAnimate={{ opacity: 0 }}
      style={styles.section}
      transition={troveTransition(reducedMotion, motion.base)}
    >
      {GROUP_ORDER.map((group) => {
        const lines = adjust.lines.filter((line) => line.envelope.group === group);
        if (lines.length === 0) return null;
        const total = lines.reduce((sum, line) => sum + typedMinor(line), 0);
        return (
          <PlanAdjustGroup
            currency={currency}
            emojiOf={(line) => envelopeEmoji(line.envelope, categoryLookup) ?? GROUP_EMOJI[group]}
            group={group}
            hintOf={(line) => {
              const before = lastMonth.get(line.envelope.id);
              return before === undefined
                ? undefined
                : `Last month · ${compactAmount(before, currency)}`;
            }}
            key={group}
            lines={lines}
            onChange={adjust.setValue}
            total={compactAmount(total, currency)}
            valueOf={adjust.valueOf}
          />
        );
      })}
      <ImpactLine text={impact.text} tone={impact.tone} />
    </EaseView>
  );
}

const styles = StyleSheet.create({
  section: { gap: 16 },
});
