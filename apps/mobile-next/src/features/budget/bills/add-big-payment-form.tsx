import { StyleSheet, View } from "react-native";

import { Button, space, Text, TextField } from "@/ui/trove";

import { useBudgetMoney } from "../currency/use-budget-currency";
import { PanelError } from "../envelope/panel-error";
import type { ActiveBudgetView } from "../home/home-model";
import { QuickAddDate } from "../quick-add/quick-add-date";

import { RepeatChips } from "./repeat-chips";
import { SavingPreview } from "./saving-preview";
import { useAddBigPaymentForm } from "./use-add-big-payment-form";

interface AddBigPaymentFormProps {
  readonly view: ActiveBudgetView;
  readonly onAdded: (name: string) => void;
  readonly onCancel: () => void;
}

/** B2: what it is, how much, when it is due, and what to set aside each payday. */
export function AddBigPaymentForm({ view, onAdded, onCancel }: AddBigPaymentFormProps) {
  const money = useBudgetMoney();
  const form = useAddBigPaymentForm({ view, onAdded });
  return (
    <View style={styles.container}>
      <Text variant="titleMd" accessibilityRole="header">
        Add a big payment
      </Text>
      <TextField
        label="What"
        placeholder="Rent cheque, school term, Ramadan"
        value={form.name}
        onChangeText={form.setName}
        maxLength={120}
      />
      <TextField
        label="How much"
        placeholder="0"
        keyboardType="decimal-pad"
        value={form.amountText}
        onChangeText={form.setAmountText}
      />
      <QuickAddDate
        label="Due date"
        date={form.dueDate}
        onChange={form.setDueDate}
        placementNote={null}
      />
      <RepeatChips value={form.repeat} onChange={form.setRepeat} />
      <TextField
        label="Already set aside"
        placeholder="0"
        keyboardType="decimal-pad"
        value={form.setAsideText}
        onChangeText={form.setSetAsideText}
      />
      <Text variant="bodySm" tone="secondary">
        {`Comes out of Not planned yet: ${money(view.current.unassignedMinor)}`}
      </Text>
      <SavingPreview preview={form.preview} />
      {form.problem ? (
        <Text accessibilityRole="alert" tone="warning" variant="bodySm">
          {form.problem}
        </Text>
      ) : null}
      <PanelError message={form.error} />
      <Button
        fullWidth
        label="Add to my plan"
        loading={form.busy}
        disabled={!form.ready}
        onPress={() => void form.submit()}
      />
      <Button fullWidth label="Not now" variant="tertiary" onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[3] },
});
