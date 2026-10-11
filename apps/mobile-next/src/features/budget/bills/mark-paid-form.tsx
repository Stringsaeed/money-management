import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY, type V2Account } from "@trove/api/v2/contracts";

import { Button } from "@/ui/button";
import { colors, spacing } from "@/ui/design-tokens";
import { Chip } from "@/ui/chip";
import { Text } from "@/ui/text";
import { TextField } from "@/ui/text-field";
import { formatMoneyMinor } from "@/utils/money";

import { PanelError } from "../envelope/panel-error";
import type { ActiveBudgetView, EnvelopeLine } from "../home/home-model";
import { ChipRow } from "../quick-add/chip-row";
import { QuickAddDate } from "../quick-add/quick-add-date";

import { afterPaymentLine, nextDueLine } from "./mark-paid-lines";
import { useMarkPaidForm } from "./use-mark-paid-form";

interface MarkPaidFormProps {
  readonly view: ActiveBudgetView;
  readonly line: EnvelopeLine;
  readonly accounts: readonly V2Account[];
  readonly onPaid: (amountMinor: number) => void;
  readonly onCancel: () => void;
}

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

/** B3: record that a big payment was made, from which account and on what day. */
export function MarkPaidForm({ view, line, accounts, onPaid, onCancel }: MarkPaidFormProps) {
  const form = useMarkPaidForm({ view, line, accounts, onPaid });
  const { envelope, totals } = line;
  const after = afterPaymentLine(totals.leftMinor, form.amountMinor, money);
  const over = form.amountMinor !== null && totals.leftMinor - form.amountMinor < 0;
  return (
    <View style={styles.container}>
      <Text variant="title" accessibilityRole="header">
        {`Mark ${envelope.name} paid`}
      </Text>
      <TextField
        label="Amount"
        keyboardType="decimal-pad"
        value={form.amountText}
        onChangeText={form.setAmountText}
      />
      {form.funding.length === 0 ? (
        <Text variant="caption" style={styles.warning}>
          No AED account is in your budget, so there is nothing to pay from.
        </Text>
      ) : (
        <ChipRow label="Paid from">
          {form.funding.map((account) => (
            <Chip
              key={account.id}
              label={account.name}
              selected={account.id === form.accountId}
              onPress={() => form.selectAccount(account.id)}
            />
          ))}
        </ChipRow>
      )}
      <QuickAddDate label="Paid on" date={form.date} onChange={form.setDate} placementNote={null} />
      <View style={styles.lines} accessibilityLiveRegion="polite">
        <Text variant="label" style={over && styles.warning}>
          {after}
        </Text>
        {over ? (
          <Text variant="caption">
            The extra shows as overspend, and you can cover it from another envelope.
          </Text>
        ) : (
          <Text variant="caption">Safe to spend stays the same.</Text>
        )}
        <Text variant="caption">{nextDueLine(envelope, money)}</Text>
      </View>
      {form.problem && form.funding.length > 0 ? (
        <Text variant="caption" accessibilityRole="alert" style={styles.warning}>
          {form.problem}
        </Text>
      ) : null}
      <PanelError message={form.error} />
      <Button
        title="Confirm paid"
        loading={form.busy}
        disabled={form.problem !== "" || form.funding.length === 0}
        onPress={() => void form.submit()}
      />
      <Button title="Not yet" variant="ghost" onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[3] },
  lines: { gap: spacing[1] },
  warning: { color: colors.textWarning },
});
