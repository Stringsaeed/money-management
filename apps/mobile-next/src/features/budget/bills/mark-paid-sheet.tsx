import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { useAccountsQuery } from "@/data/ledger-queries";
import { Sheet } from "@/ui/sheet";
import { showToast } from "@/ui/toast";
import { formatMoneyMinor } from "@/utils/money";

import { envelopeLines, type ActiveBudgetView } from "../home/home-model";

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
  const accounts = useAccountsQuery();
  const line = envelopeLines(view).find((item) => item.envelope.id === envelopeId);
  return (
    <Sheet open={open} onDismiss={onDismiss} snapPoints={["full"]}>
      {line ? (
        <MarkPaidForm
          key={session}
          view={view}
          line={line}
          accounts={accounts.data}
          onPaid={(amountMinor) => {
            showToast({
              message: `${line.envelope.name} marked paid: ${formatMoneyMinor(amountMinor, BUDGET_CURRENCY)}`,
            });
            onDismiss();
          }}
          onCancel={onDismiss}
        />
      ) : null}
    </Sheet>
  );
}
