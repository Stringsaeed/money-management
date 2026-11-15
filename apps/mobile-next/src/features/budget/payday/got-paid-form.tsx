import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { CtaStack, DateSheet, showToast, Text } from "@/ui/trove";
import { parseDateKey } from "@/utils/date";

import { useBudgetCurrency } from "../currency/use-budget-currency";
import type { ActiveBudgetView } from "../home/home-model";
import { useReminderPrefs } from "../reminders/use-reminder-prefs";

import { ChoiceSheet } from "./choice-sheet";
import { GotPaidAmount } from "./got-paid-amount";
import { GotPaidFields, type GotPaidField } from "./got-paid-fields";
import { GotPaidHeader } from "./got-paid-header";
import { GotPaidNote } from "./got-paid-note";
import { gotPaidDateLabel, gotPaidNote, paydayKicker } from "./payday-copy";
import { codeBalance } from "./payday-money";
import { useGotPaidForm } from "./use-got-paid-form";

type OpenSheet = "account" | "category" | "date" | null;

/** C0: log this payday's salary as one income into a funding account. */
export function GotPaidForm({ view }: { readonly view: ActiveBudgetView }) {
  const currency = useBudgetCurrency();
  const form = useGotPaidForm(view);
  const reminders = useReminderPrefs();
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const close = () => setSheet(null);

  const fields: GotPaidField[] = [];
  if (form.accountChoices.length > 0) {
    fields.push({
      key: "account",
      label: "Into",
      value: form.account?.name ?? "Choose",
      onPress: () => setSheet("account"),
    });
  }
  fields.push({
    key: "date",
    label: "Date",
    value: gotPaidDateLabel(form.date, form.today),
    onPress: () => setSheet("date"),
  });
  if (form.categoryChoices.length > 1) {
    fields.push({
      key: "category",
      label: "Category",
      value: form.category?.name ?? "Choose",
      onPress: () => setSheet("category"),
    });
  }

  return (
    <View style={styles.form}>
      <GotPaidHeader kicker={paydayKicker(view.current.period.start)} />
      <GotPaidAmount
        currency={currency}
        onChangeText={form.setAmountText}
        value={form.amountText}
      />
      {form.accountChoices.length === 0 ? (
        <Text tone="secondary" variant="bodySm">
          {`None of your budget accounts can receive a salary. Add a ${currency} account to the money you have first.`}
        </Text>
      ) : null}
      <GotPaidFields fields={fields} />
      <GotPaidNote text={gotPaidNote(view.current.period, form.nextStep)} />
      {form.error ? (
        <Text accessibilityRole="alert" tone="negative" variant="labelMd">
          {form.error}
        </Text>
      ) : null}
      <CtaStack
        link={{
          label: "Not yet · remind me tomorrow",
          onPress: () => {
            void reminders.snoozePayday(currency, form.today);
            showToast({ message: "We'll remind you again tomorrow." });
            router.back();
          },
        }}
        primary={{ label: "Got paid", loading: form.busy, onPress: () => void form.submit() }}
        spacing="tight"
      />
      <ChoiceSheet
        choices={form.accountChoices.map((account) => ({
          id: account.id,
          title: account.name,
          trailing: codeBalance(account.balanceMinor, account.currency),
        }))}
        onDismiss={close}
        onSelect={form.setAccountId}
        open={sheet === "account"}
        selectedId={form.accountId}
        title="Into"
      />
      <ChoiceSheet
        choices={form.categoryChoices.map((category) => ({
          id: category.id,
          title: category.name,
        }))}
        onDismiss={close}
        onSelect={form.setCategoryId}
        open={sheet === "category"}
        selectedId={form.categoryId}
        title="Category"
      />
      <DateSheet
        onChange={form.setDate}
        onDismiss={close}
        open={sheet === "date"}
        title="Salary date"
        today={parseDateKey(form.today) ?? undefined}
        value={form.date}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
});
