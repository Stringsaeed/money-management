import { router } from "expo-router";

import { Amount, ListRow } from "@/ui/trove";

import { useBudgetCurrency, useBudgetMoney } from "../currency/use-budget-currency";
import type { EnvelopeLine } from "../home/home-model";

/** An envelope and what is planned in it this month; opens Envelope detail to change the plan. */
export function PlanEnvelopeRow({ line }: { readonly line: EnvelopeLine }) {
  const money = useBudgetMoney();
  const currency = useBudgetCurrency();
  const planned = money(line.totals.plannedMinor);
  return (
    <ListRow
      accessibilityLabel={`${line.envelope.name}, ${planned} planned. Change plan`}
      chevron
      onPress={() =>
        router.push({ pathname: "/budget/envelope/[id]", params: { id: line.envelope.id } })
      }
      title={line.envelope.name}
      trailing={<Amount currency={currency} minor={line.totals.plannedMinor} tone="secondary" />}
    />
  );
}
