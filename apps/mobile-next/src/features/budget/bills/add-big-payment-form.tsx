import { format, parseISO } from "date-fns";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { FlowButton, Text } from "@/ui/trove";

import { useBudgetMoney } from "../currency/use-budget-currency";
import { PanelError } from "../envelope/panel-error";
import type { ActiveBudgetView } from "../home/home-model";
import { SheetHeading } from "../sheet-heading";

import { FieldButtonRow } from "./field-button-row";
import { FieldGroup } from "./field-group";
import { FieldInputRow } from "./field-input-row";
import { InlineDatePicker } from "./inline-date-picker";
import { RepeatChips } from "./repeat-chips";
import { SavingPreview } from "./saving-preview";
import { useAddBigPaymentForm } from "./use-add-big-payment-form";

interface AddBigPaymentFormProps {
  readonly view: ActiveBudgetView;
  readonly onAdded: (name: string) => void;
  readonly onCancel: () => void;
}

/** Board label column on Add a big payment. */
const LABEL_WIDTH = 118;

/** B2: what it is, how much, when it is due, and what to set aside each payday. */
export function AddBigPaymentForm({ view, onAdded, onCancel }: AddBigPaymentFormProps) {
  const money = useBudgetMoney();
  const form = useAddBigPaymentForm({ view, onAdded });
  const [picking, setPicking] = useState(false);
  const { currency } = view.budget;
  return (
    <View style={styles.container}>
      <SheetHeading onClose={onCancel} stamp="Saving for" title="Add a big payment" />
      <FieldGroup>
        <FieldInputRow
          font="words"
          label="What"
          labelWidth={LABEL_WIDTH}
          maxLength={120}
          onChangeText={form.setName}
          placeholder="Rent cheque, school term"
          value={form.name}
        />
        <FieldInputRow
          font="money"
          keyboardType="decimal-pad"
          label="How much"
          labelWidth={LABEL_WIDTH}
          onChangeText={form.setAmountText}
          placeholder="0"
          prefix={currency}
          value={form.amountText}
        />
        <FieldButtonRow
          expanded={picking}
          font="money"
          icon="calendar"
          label="Due date"
          labelWidth={LABEL_WIDTH}
          onPress={() => setPicking((open) => !open)}
          value={format(parseISO(form.dueDate), "EEE d MMM yyyy")}
        />
        <FieldInputRow
          font="money"
          keyboardType="decimal-pad"
          label="Already set aside"
          labelWidth={LABEL_WIDTH}
          onChangeText={form.setSetAsideText}
          placeholder="0"
          prefix={currency}
          value={form.setAsideText}
        />
      </FieldGroup>
      {picking ? (
        <InlineDatePicker date={form.dueDate} minDate={form.today} onChange={form.setDueDate} />
      ) : null}
      {form.setAsideText.trim() === "" ? null : (
        <Text tone="secondary" variant="bodySm">
          {`Comes out of Not planned yet: ${money(view.current.unassignedMinor)}`}
        </Text>
      )}
      <RepeatChips value={form.repeat} onChange={form.setRepeat} />
      <SavingPreview
        currency={currency}
        dueDate={form.dueDate}
        preview={form.preview}
        repeat={form.repeat}
      />
      {form.problem ? (
        <Text accessibilityRole="alert" tone="warning" variant="bodySm">
          {form.problem}
        </Text>
      ) : null}
      <PanelError message={form.error} />
      <FlowButton
        disabled={!form.ready}
        label="Add to my plan"
        loading={form.busy}
        onPress={() => void form.submit()}
        size="cta"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Sheet content already pads 8 top / 24 bottom; the board sheet pads 20 / 34.
  container: { gap: 14, paddingBottom: 10, paddingTop: 12 },
});
