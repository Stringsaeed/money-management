import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { colors, spacing, typography } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { TextField } from "@/ui/text-field";
import { showToast } from "@/ui/toast";

import type { ActiveBudgetView } from "../home/home-model";
import { periodLabel } from "../envelope/envelope-model";
import { ChipRow } from "../quick-add/chip-row";
import { QuickAddDate } from "../quick-add/quick-add-date";
import { useReminderPrefs } from "../reminders/use-reminder-prefs";

import { useGotPaidForm } from "./use-got-paid-form";

/** C0: log this payday's salary as one income into a funding account. */
export function GotPaidForm({ view }: { readonly view: ActiveBudgetView }) {
  const form = useGotPaidForm(view);
  const reminders = useReminderPrefs();
  return (
    <View style={styles.container}>
      <Text variant="headline" accessibilityRole="header">
        Got paid
      </Text>
      <TextField
        label="Salary amount (AED)"
        value={form.amountText}
        onChangeText={form.setAmountText}
        keyboardType="decimal-pad"
        returnKeyType="done"
      />
      {form.accountChoices.length > 0 ? (
        <ChipRow label="Into account">
          {form.accountChoices.map((account) => (
            <Chip
              key={account.id}
              label={account.name}
              selected={account.id === form.accountId}
              onPress={() => form.setAccountId(account.id)}
            />
          ))}
        </ChipRow>
      ) : (
        <Text variant="caption">
          None of your budget accounts can receive a salary. Add an AED account to the money you
          have first.
        </Text>
      )}
      {form.categoryChoices.length > 1 ? (
        <ChipRow label="Category">
          {form.categoryChoices.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              selected={category.id === form.categoryId}
              onPress={() => form.setCategoryId(category.id)}
            />
          ))}
        </ChipRow>
      ) : null}
      <QuickAddDate date={form.date} onChange={form.setDate} placementNote={null} />
      <Text variant="caption">{`This starts your new month: ${periodLabel(view.current.period)}`}</Text>
      {form.error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {form.error}
        </Text>
      ) : null}
      <Button title="Got paid" loading={form.busy} onPress={() => void form.submit()} />
      <Button
        title="Not yet: remind me tomorrow"
        variant="ghost"
        onPress={() => {
          void reminders.snoozePayday(form.today);
          showToast({ message: "We'll remind you again tomorrow." });
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[3] },
  error: { color: colors.destructive, fontFamily: typography.fontBodyMedium },
});
