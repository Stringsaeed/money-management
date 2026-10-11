import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Button, showToast, space } from "@/ui/trove";

import { useBudgetCurrency } from "../currency/use-budget-currency";
import type { UseReminderPrefs } from "../reminders/use-reminder-prefs";

import { PAYDAY_ROUTES } from "./payday-flow";

interface PaydayActionsProps {
  readonly today: string;
  readonly reminders: UseReminderPrefs;
}

/** Under the payday attention line: log the salary, or be reminded again tomorrow. */
export function PaydayActions({ today, reminders }: PaydayActionsProps) {
  const currency = useBudgetCurrency();
  const reminded = reminders.prefs.paydaySnoozedOn[currency] === today;
  return (
    <View style={styles.row}>
      <View style={styles.action}>
        <Button fullWidth label="Got paid" onPress={() => router.push(PAYDAY_ROUTES.gotPaid)} />
      </View>
      <View style={styles.action}>
        <Button
          fullWidth
          label={reminded ? "Reminding tomorrow" : "Not yet"}
          variant="secondary"
          disabled={reminded}
          onPress={() => {
            void reminders.snoozePayday(currency, today);
            showToast({ message: "We'll remind you again tomorrow." });
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space[2] },
  action: { flex: 1 },
});
