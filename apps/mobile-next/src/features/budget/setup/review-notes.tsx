import { StyleSheet, View } from "react-native";

import type { V2PaydayRule } from "@trove/api/v2/contracts";

import { noSafeToSpendReason } from "../home/home-model";
import { countedOnceLine, remindersLine } from "./setup-copy";
import { SetupFootnote } from "./setup-footnote";
import type { SetupItem } from "./setup-items";

interface ReviewNotesProps {
  readonly periodStart: string;
  readonly safeToSpendMinor: number;
  readonly ticked: readonly SetupItem[];
  readonly paydayReminder: boolean;
  readonly payday: V2PaydayRule;
}

/** S5's lines under the receipt: why Safe to spend is zero (if it is), counted once, reminders. */
export function ReviewNotes({
  periodStart,
  safeToSpendMinor,
  ticked,
  paydayReminder,
  payday,
}: ReviewNotesProps) {
  // Bills that come from a Recurring rule are the ones that get bill reminders.
  const billReminders = ticked.filter(
    (item) => item.group === "bills" && item.recurringMinor !== null,
  ).length;
  const reminders = remindersLine(billReminders, paydayReminder, payday);
  const reason = noSafeToSpendReason(safeToSpendMinor);
  return (
    <View style={styles.notes}>
      {reason ? <SetupFootnote emoji="⚠️" text={`${reason}.`} /> : null}
      <SetupFootnote emoji="🧾" text={countedOnceLine(periodStart)} />
      {reminders ? <SetupFootnote emoji="🔔" text={reminders} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  notes: { gap: 10 },
});
