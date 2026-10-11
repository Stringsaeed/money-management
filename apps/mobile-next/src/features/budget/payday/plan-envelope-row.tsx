import { router } from "expo-router";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Amount, ListRow } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import type { EnvelopeLine } from "../home/home-model";

/** An envelope and what is planned in it this month; opens Envelope detail to change the plan. */
export function PlanEnvelopeRow({ line }: { readonly line: EnvelopeLine }) {
  const planned = formatMoneyMinor(line.totals.plannedMinor, BUDGET_CURRENCY);
  return (
    <ListRow
      accessibilityLabel={`${line.envelope.name}, ${planned} planned. Change plan`}
      chevron
      onPress={() =>
        router.push({ pathname: "/budget/envelope/[id]", params: { id: line.envelope.id } })
      }
      title={line.envelope.name}
      trailing={
        <Amount currency={BUDGET_CURRENCY} minor={line.totals.plannedMinor} tone="secondary" />
      }
    />
  );
}
