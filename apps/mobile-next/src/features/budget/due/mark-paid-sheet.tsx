import { useAccountsQuery } from "@/data/ledger-queries";
import { Sheet } from "@/ui/sheet";

import { MarkPaidForm } from "./mark-paid-form";
import type { MarkPaidTarget } from "./use-mark-paid-target";
import type { UseDue } from "./use-due";

interface MarkPaidSheetProps {
  readonly target: MarkPaidTarget;
  readonly due: UseDue;
  readonly onDismiss: () => void;
}

/** M3's Mark paid sheet for one bill. */
export function MarkPaidSheet({ target, due, onDismiss }: MarkPaidSheetProps) {
  const accounts = useAccountsQuery();
  const { item } = target;
  const choices = accounts.data.filter(
    (account) => !account.archived && account.currency === item?.currency,
  );
  return (
    <Sheet open={target.open} onDismiss={onDismiss} snapPoints={["full"]}>
      {item ? (
        <MarkPaidForm
          key={target.session}
          item={item}
          accounts={choices}
          muted={due.reminders.prefs.mutedRuleIds.includes(item.ruleId)}
          onMutedChange={(muted) => void due.reminders.setMuted(item.ruleId, muted)}
          onPaid={onDismiss}
        />
      ) : null}
    </Sheet>
  );
}
