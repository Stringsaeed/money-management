import { Alert, ScrollView, StyleSheet, View } from "react-native";

import type { V2DueOccurrence } from "@trove/api/v2/contracts";

import { useBudgetQuery } from "@/data/ledger-queries";
import { useLedgerMutationsWithSound } from "@/features/sound";
import { EmptyState, layout, Screen, showToast, space, Text } from "@/ui/trove";

import type { ActiveBudgetView } from "../home/home-model";
import { useReminderSync } from "../reminders/use-reminder-sync";

import { dueDateLabel } from "./due-date-label";
import { DueHeader } from "./due-header";
import { nextDay } from "./due-model";
import { DueRow } from "./due-row";
import { MarkPaidSheet } from "./mark-paid-sheet";
import { occurrenceErrorMessage } from "./mark-paid-model";
import { SalaryRow } from "./salary-row";
import { useDue } from "./use-due";
import { useMarkPaidTarget } from "./use-mark-paid-target";

/** M3: bills to pay, from overdue to the next payday. */
export function DueScreen() {
  const budget = useBudgetQuery();

  if (budget.isError && !budget.data) {
    return (
      <Screen style={styles.screen}>
        <DueHeader />
        <EmptyState
          title="Couldn't load your bills"
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={() => void budget.retry()}
          framed={false}
        />
      </Screen>
    );
  }
  if (!budget.data) {
    return (
      <Screen style={styles.screen}>
        <DueHeader />
        <Text variant="bodySm" tone="secondary" style={styles.status}>
          Loading your bills…
        </Text>
      </Screen>
    );
  }
  if (!budget.data.budget) {
    return (
      <Screen style={styles.screen}>
        <DueHeader />
        <EmptyState
          title="No budget yet"
          message="Set up a budget to see the bills due."
          framed={false}
        />
      </Screen>
    );
  }
  return <DueContent view={budget.data} />;
}

function DueContent({ view }: { readonly view: ActiveBudgetView }) {
  const due = useDue(view);
  const mutations = useLedgerMutationsWithSound();
  const markPaid = useMarkPaidTarget();
  // Keeps local reminders in step when a bill is snoozed, even if the Budget tab is not open.
  useReminderSync(view, due);

  const snooze = (item: V2DueOccurrence) => {
    void due.reminders.snooze(item.ruleId, item.scheduledDate, nextDay(due.today));
    showToast({ message: `${item.name} is snoozed until tomorrow` });
  };
  const confirmSkip = (item: V2DueOccurrence) =>
    Alert.alert(
      `Skip ${item.name}?`,
      `Nothing is recorded for ${dueDateLabel(item.scheduledDate)}, and it leaves your Due list.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Skip",
          style: "destructive",
          onPress: () => void skip(item),
        },
      ],
    );
  const skip = async (item: V2DueOccurrence) => {
    try {
      await mutations.skipOccurrence(item.ruleId, item.scheduledDate);
      showToast({ message: `Skipped ${item.name}` });
    } catch (cause) {
      showToast({ message: occurrenceErrorMessage(cause, "skip") });
    }
  };

  if (due.isError && !due.loaded) {
    return (
      <Screen style={styles.screen}>
        <DueHeader />
        <EmptyState
          title="Couldn't load your bills"
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={() => void due.retry()}
          framed={false}
        />
      </Screen>
    );
  }
  if (!due.loaded) {
    return (
      <Screen style={styles.screen}>
        <DueHeader />
        <Text variant="bodySm" tone="secondary" style={styles.status}>
          Loading your bills…
        </Text>
      </Screen>
    );
  }

  const salary = view.budget.usualSalaryMinor;
  const empty = due.sections.every((section) => section.items.length === 0) && !salary;
  return (
    <Screen style={styles.screen}>
      <DueHeader />
      <ScrollView contentContainerStyle={styles.content}>
        {empty ? (
          <EmptyState
            title="Nothing due"
            message="Bills you set up as reminders show here before they are due. Nothing is recorded until you mark it paid."
            framed={false}
          />
        ) : null}
        {due.sections.map((section) => {
          const showSalary = section.key === "payday" && salary !== null && salary > 0;
          if (section.items.length === 0 && !showSalary) return null;
          return (
            <View key={section.key} style={styles.section}>
              <Text variant="titleMd">{section.title}</Text>
              {section.items.map((item) => (
                <DueRow
                  key={`${item.ruleId}|${item.scheduledDate}`}
                  item={item}
                  late={section.key === "overdue"}
                  muted={due.reminders.prefs.mutedRuleIds.includes(item.ruleId)}
                  onMarkPaid={() => markPaid.openFor(item)}
                  onSnooze={
                    section.key === "overdue" || section.key === "today"
                      ? () => snooze(item)
                      : undefined
                  }
                  onSkip={() => confirmSkip(item)}
                />
              ))}
              {showSalary ? <SalaryRow amountMinor={salary} payday={due.nextPayday} /> : null}
            </View>
          );
        })}
        {due.snoozedCount > 0 ? (
          <Text variant="bodySm" tone="secondary">
            {due.snoozedCount} {due.snoozedCount === 1 ? "bill is" : "bills are"} snoozed until
            tomorrow.
          </Text>
        ) : null}
      </ScrollView>
      <MarkPaidSheet target={markPaid.target} due={due} onDismiss={markPaid.close} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: layout.screenGutter },
  content: { gap: space[5], paddingBottom: space[10], paddingTop: space[3] },
  section: { gap: space[3] },
  status: { paddingVertical: space[5] },
});
