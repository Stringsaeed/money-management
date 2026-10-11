import { useAccountsQuery } from "@/data/ledger-queries";
import { Sheet } from "@/ui/trove";

import { useBudgetCurrency } from "../currency/use-budget-currency";
import { MarkPaidForm } from "./mark-paid-form";
import { markPaidAccounts } from "./mark-paid-model";
import type { MarkPaidTarget } from "./use-mark-paid-target";
import type { UseDue } from "./use-due";

interface MarkPaidSheetProps {
  readonly target: MarkPaidTarget;
  readonly due: UseDue;
  readonly fundingAccountIds: readonly string[];
  readonly onDismiss: () => void;
}

/** M3's Mark paid sheet for one bill. */
export function MarkPaidSheet({ target, due, fundingAccountIds, onDismiss }: MarkPaidSheetProps) {
  const accounts = useAccountsQuery();
  const currency = useBudgetCurrency();
  const { item } = target;
  const choices = item ? markPaidAccounts(accounts.data, item, fundingAccountIds, currency) : [];
  return (
    <Sheet open={target.open} onDismiss={onDismiss} snapPoints={["full"]}>
      {item ? (
        <MarkPaidForm
          key={target.session}
          item={item}
          accounts={choices}
          today={due.today}
          muted={due.reminders.prefs.mutedRuleIds.includes(item.ruleId)}
          onMutedChange={(muted) => void due.reminders.setMuted(item.ruleId, muted)}
          onPaid={onDismiss}
        />
      ) : null}
    </Sheet>
  );
}
