import { useAccountsQuery } from "@/data/ledger-queries";
import { Sheet } from "@/ui/trove";

import { useBudgetCurrency } from "../currency/use-budget-currency";
import type { EnvelopeLine } from "../home/home-model";

import { billEnvelope } from "./due-readiness";
import { MarkPaidForm } from "./mark-paid-form";
import { markPaidAccounts } from "./mark-paid-model";
import type { MarkPaidTarget } from "./use-mark-paid-target";
import type { UseDue } from "./use-due";

interface MarkPaidSheetProps {
  readonly target: MarkPaidTarget;
  readonly due: UseDue;
  readonly fundingAccountIds: readonly string[];
  /** Active envelopes, for the receipt of what the bill's envelope has left. */
  readonly lines: readonly EnvelopeLine[];
  /** Category icon of a bill, for the header tile. */
  readonly iconFor: (categoryId: string | null) => string | null;
  readonly onDismiss: () => void;
  /** Absent for a read-only viewer. */
  readonly onSkip?: (item: NonNullable<MarkPaidTarget["item"]>) => void;
}

/** M3's Mark paid sheet for one bill. */
export function MarkPaidSheet({
  target,
  due,
  fundingAccountIds,
  lines,
  iconFor,
  onDismiss,
  onSkip,
}: MarkPaidSheetProps) {
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
          envelope={billEnvelope(item, lines, currency)}
          icon={iconFor(item.categoryId)}
          muted={due.reminders.prefs.mutedRuleIds.includes(item.ruleId)}
          onMutedChange={(muted) => void due.reminders.setMuted(item.ruleId, muted)}
          onPaid={onDismiss}
          onCancel={onDismiss}
          onSkip={
            onSkip
              ? () => {
                  onDismiss();
                  onSkip(item);
                }
              : undefined
          }
        />
      ) : null}
    </Sheet>
  );
}
