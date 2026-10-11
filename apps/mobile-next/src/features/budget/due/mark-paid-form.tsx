import { StyleSheet, View } from "react-native";

import type { V2Account, V2DueOccurrence } from "@trove/api/v2/contracts";

import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { colors, radii, spacing, typography } from "@/ui/design-tokens";
import { Switch } from "@/ui/switch";
import { Text } from "@/ui/text";
import { TextField } from "@/ui/text-field";

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
      <Text variant="title">Mark {item.name} paid</Text>
      <TextField
        label="Amount"
        value={form.amountText}
        onChangeText={form.setAmountText}
        keyboardType="decimal-pad"
        returnKeyType="done"
      />
      <Text variant="caption">
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
      <View style={styles.muteRow}>
        <View style={styles.muteText}>
          <Text variant="body">Mute reminders for this bill</Text>
          <Text variant="caption">It stays on your Due list.</Text>
        </View>
        <Switch
          accessibilityLabel="Mute reminders for this bill"
          value={muted}
          onValueChange={onMutedChange}
        />
      </View>
      {form.error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {form.error}
        </Text>
      ) : null}
      <Button title="Mark paid" loading={form.busy} onPress={() => void form.submit()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[3] },
  muteRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    flexDirection: "row",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  muteText: { flex: 1 },
  error: {
    color: colors.destructive,
    fontFamily: typography.fontBodyMedium,
    textAlign: "center",
  },
});
