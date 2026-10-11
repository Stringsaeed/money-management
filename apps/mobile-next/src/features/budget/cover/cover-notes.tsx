import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Text } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import type { CoverPlan } from "./cover-move-model";

interface CoverNotesProps {
  readonly name: string;
  /** The covered envelope's Left once the move is made. */
  readonly afterLeftMinor: number;
  readonly plan: CoverPlan;
  readonly hasSources: boolean;
}

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

/** Under the sources: what the envelope will have, and what a partial cover leaves over. */
export function CoverNotes({ name, afterLeftMinor, plan, hasSources }: CoverNotesProps) {
  return (
    <>
      {plan.coveredMinor > 0 ? (
        <Text variant="labelSm" tone="secondary" accessibilityLiveRegion="polite">
          {`${name} after: ${money(afterLeftMinor)} left`}
        </Text>
      ) : null}
      {plan.restMinor > 0 && hasSources ? (
        <Text variant="bodySm" tone="secondary" accessibilityLiveRegion="polite">
          {plan.coveredMinor > 0
            ? `${money(plan.restMinor)} is still over. The rest comes out of next month's money.`
            : "Pick at least one source to cover it."}
        </Text>
      ) : null}
    </>
  );
}
