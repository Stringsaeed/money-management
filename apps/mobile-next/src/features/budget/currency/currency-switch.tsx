import { useSelectedBudget } from "@/data/ledger-queries";
import { SegmentedControl } from "@/ui/trove";

/** Budget home's currency switch. Only a ledger with two or more budgets has anything to switch. */
export function CurrencySwitch() {
  const { budgets, currency, select } = useSelectedBudget();
  if (budgets.length < 2 || currency === null) return null;
  return (
    <SegmentedControl
      accessibilityLabel="Budget currency"
      options={budgets.map((budget) => ({ value: budget.currency, label: budget.currency }))}
      value={currency}
      onChange={(next) => void select(next)}
    />
  );
}
