import { useAccountsQuery, useCategoriesQuery } from "@/data/ledger-queries";
import { Sheet, showToast } from "@/ui/trove";

import { useBudgetMoney } from "../currency/use-budget-currency";
import { envelopeLines, type ActiveBudgetView } from "../home/home-model";

import { envelopeTileIcon } from "./envelope-tile";
import { MarkPaidForm } from "./mark-paid-form";

interface MarkPaidSheetProps {
  readonly open: boolean;
  /** Changes on every open so the form starts fresh each time. */
  readonly session: number;
  readonly envelopeId: string | null;
  readonly view: ActiveBudgetView;
  readonly onDismiss: () => void;
}

/** B3: Mark big payment paid, opened from a Saving-for row. */
export function MarkPaidSheet({ open, session, envelopeId, view, onDismiss }: MarkPaidSheetProps) {
  const money = useBudgetMoney();
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const line = envelopeLines(view).find((item) => item.envelope.id === envelopeId);
  const iconByCategoryId = new Map(
    categories.data.map((category): [string, string] => [category.id, category.icon]),
  );
  return (
    <Sheet surface="canvas" open={open} onDismiss={onDismiss} snapPoints={["full"]}>
      {line ? (
        <MarkPaidForm
          key={session}
          view={view}
          line={line}
          icon={envelopeTileIcon(line.envelope, iconByCategoryId)}
          accounts={accounts.data}
          onPaid={(amountMinor) => {
            showToast({
              message: `${line.envelope.name} marked paid: ${money(amountMinor)}`,
            });
            onDismiss();
          }}
          onCancel={onDismiss}
        />
      ) : null}
    </Sheet>
  );
}
