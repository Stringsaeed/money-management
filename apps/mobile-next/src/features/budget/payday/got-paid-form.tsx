import { router } from "expo-router";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";
import { StyleSheet, View } from "react-native";

import { AmountInput, Button, Chip, showToast, space, Text } from "@/ui/trove";

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
      <Text variant="titleLg" accessibilityRole="header">
        Got paid
      </Text>
      <AmountInput
        currency={BUDGET_CURRENCY}
        label="Salary amount (AED)"
        value={form.amountText}
        onChangeText={form.setAmountText}
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
        <Text variant="bodySm" tone="secondary">
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
      <Text
        variant="bodySm"
        tone="secondary"
      >{`This starts your new month: ${periodLabel(view.current.period)}`}</Text>
      {form.error ? (
        <Text accessibilityRole="alert" tone="negative" variant="labelMd">
          {form.error}
        </Text>
      ) : null}
      <Button fullWidth label="Got paid" loading={form.busy} onPress={() => void form.submit()} />
      <Button
        fullWidth
        label="Not yet: remind me tomorrow"
        variant="tertiary"
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
  container: { gap: space[3] },
});
