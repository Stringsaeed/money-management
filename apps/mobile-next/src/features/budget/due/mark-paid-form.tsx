import { StyleSheet, View } from "react-native";

import type { V2Account, V2DueOccurrence } from "@trove/api/v2/contracts";

import { AmountInput, Button, Chip, ListGroup, ListRow, space, Switch, Text } from "@/ui/trove";

import { ChipRow } from "../quick-add/chip-row";
import { QuickAddDate } from "../quick-add/quick-add-date";

import { useMarkPaidForm } from "./use-mark-paid-form";

interface MarkPaidFormProps {
  readonly item: V2DueOccurrence;
  /** Active accounts in the bill's currency. */
  readonly accounts: readonly V2Account[];
  readonly muted: boolean;
  readonly onMutedChange: (muted: boolean) => void;
  readonly onPaid: () => void;
}

/** Confirms a bill: amount, account and date are editable and apply to this payment only. */
export function MarkPaidForm({ item, accounts, muted, onMutedChange, onPaid }: MarkPaidFormProps) {
  const form = useMarkPaidForm(item, onPaid);
  return (
    <View style={styles.container}>
      <Text variant="titleMd">Mark {item.name} paid</Text>
      <AmountInput
        currency={item.currency}
        label="Amount"
        value={form.amountText}
        onChangeText={form.setAmountText}
      />
      <Text tone="secondary" variant="bodySm">
        Changing the amount only affects this payment. The bill itself stays the same.
      </Text>
      <ChipRow label="Paid from">
        {accounts.map((account) => (
          <Chip
            key={account.id}
            label={account.name}
            selected={account.id === form.accountId}
            onPress={() => form.setAccountId(account.id)}
          />
        ))}
      </ChipRow>
      <QuickAddDate date={form.date} onChange={form.setDate} placementNote={null} />
      <ListGroup dividerInset={0}>
        <ListRow
          title="Mute reminders for this bill"
          subtitle="It stays on your Due list."
          trailing={
            <Switch
              accessibilityLabel="Mute reminders for this bill"
              value={muted}
              onValueChange={onMutedChange}
            />
          }
        />
      </ListGroup>
      {form.error ? (
        <Text accessibilityRole="alert" style={styles.centered} tone="negative" variant="labelMd">
          {form.error}
        </Text>
      ) : null}
      <Button fullWidth label="Mark paid" loading={form.busy} onPress={() => void form.submit()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[3] },
  centered: { textAlign: "center" },
});
