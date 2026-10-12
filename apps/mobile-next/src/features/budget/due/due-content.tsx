import { ScrollView } from "react-native";

import { EmptyState, Screen, Text } from "@/ui/trove";

import { envelopeLines, type ActiveBudgetView } from "../home/home-model";
import { useReminderSync } from "../reminders/use-reminder-sync";

import { dueStamp } from "./due-display";
import { DueFrame } from "./due-frame";
import { DueHeader } from "./due-header";
import { dueLayout } from "./due-layout";
import { DueSections } from "./due-sections";
import { MarkPaidSheet } from "./mark-paid-sheet";
import { useDue } from "./use-due";
import { useDueBillsView } from "./use-due-bills-view";
import { useMarkPaidTarget } from "./use-mark-paid-target";
import { usePaidBills } from "./use-paid-bills";

/** M3's list once the budget has loaded: overdue, today, this week, up to payday, and paid. */
export function DueContent({ view }: { readonly view: ActiveBudgetView }) {
  const due = useDue(view);
  const paid = usePaidBills(view);
  const markPaid = useMarkPaidTarget();
  const bills = useDueBillsView(view, due, markPaid.openFor);
  // Keeps local reminders in step when a bill is snoozed, even if the Budget tab is not open.
  useReminderSync();

  // A failed refresh hides the list too: an old list could show a bill that is already paid.
  if (due.isError) {
    return (
      <DueFrame>
        <EmptyState
          title="Couldn't load your bills"
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={() => void due.retry()}
          framed={false}
        />
      </DueFrame>
    );
  }
  if (!due.loaded) {
    return (
      <DueFrame>
        <Text variant="bodySm" tone="secondary">
          Loading your bills…
        </Text>
      </DueFrame>
    );
  }

  return (
    <Screen style={dueLayout.screen}>
      <ScrollView contentContainerStyle={dueLayout.content} showsVerticalScrollIndicator={false}>
        <DueHeader stamp={dueStamp(due.today)} />
        <DueSections bills={bills} due={due} paid={paid} view={view} />
      </ScrollView>
      <MarkPaidSheet
        due={due}
        fundingAccountIds={view.fundingAccountIds}
        iconFor={bills.iconFor}
        lines={envelopeLines(view)}
        onDismiss={markPaid.close}
        onSkip={bills.canPay ? bills.skip : undefined}
        target={markPaid.target}
      />
    </Screen>
  );
}
