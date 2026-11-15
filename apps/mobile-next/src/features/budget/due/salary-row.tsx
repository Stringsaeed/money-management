import { amountParts } from "@/ui/trove";

import { useBudgetCurrency, useBudgetMoney } from "../currency/use-budget-currency";

import { dueDateLabel } from "./due-date-label";
import { dueWhen } from "./due-display";
import { DueListRow } from "./due-list-row";

interface SalaryRowProps {
  readonly amountMinor: number;
  readonly payday: string;
}

const NOTE = { text: "Not counted until you tap Got paid", tone: "tertiary" } as const;

/** The usual salary, shown for information: it is not budget money until Got paid posts it. */
export function SalaryRow({ amountMinor, payday }: SalaryRowProps) {
  const money = useBudgetMoney();
  const currency = useBudgetCurrency();
  return (
    <DueListRow
      accessibilityLabel={`Expected salary about ${money(amountMinor)} on ${dueDateLabel(payday)}. Not counted until you tap Got paid.`}
      figure={`≈ ${amountParts(amountMinor, currency, "never").whole}`}
      icon="💰"
      name="Salary"
      note={NOTE}
      quiet
      when={dueWhen(payday)}
    />
  );
}
