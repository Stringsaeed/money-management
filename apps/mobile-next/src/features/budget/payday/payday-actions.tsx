import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Button } from "@/ui/button";
import { spacing } from "@/ui/design-tokens";
import { showToast } from "@/ui/toast";

import type { UseReminderPrefs } from "../reminders/use-reminder-prefs";

import { PAYDAY_ROUTES } from "./payday-flow";

interface PaydayActionsProps {
  readonly today: string;
  readonly reminders: UseReminderPrefs;
}

/** Under the payday attention line: log the salary, or be reminded again tomorrow. */
export function PaydayActions({ today, reminders }: PaydayActionsProps) {
  const reminded = reminders.prefs.paydaySnoozedOn === today;
  return (
    <View style={styles.row}>
      <View style={styles.action}>
        <Button title="Got paid" onPress={() => router.push(PAYDAY_ROUTES.gotPaid)} />
      </View>
      <View style={styles.action}>
        <Button
          title={reminded ? "Reminding tomorrow" : "Not yet"}
          variant="secondary"
          disabled={reminded}
          onPress={() => {
            void reminders.snoozePayday(today);
            showToast({ message: "We'll remind you again tomorrow." });
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing[2] },
  action: { flex: 1 },
});
