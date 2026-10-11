import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY, type V2Account } from "@trove/api/v2/contracts";

import { AmountInput, Button, Chip, space, Text } from "@/ui/trove";
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
      <Text variant="titleMd" accessibilityRole="header">
        {`Mark ${envelope.name} paid`}
      </Text>
      <AmountInput
        currency={BUDGET_CURRENCY}
        label="Amount"
        value={form.amountText}
        onChangeText={form.setAmountText}
      />
      {form.funding.length === 0 ? (
        <Text tone="warning" variant="bodySm">
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
        <Text tone={over ? "warning" : "secondary"} variant="labelSm">
          {after}
        </Text>
        {over ? (
          <Text variant="bodySm" tone="secondary">
            The extra shows as overspend, and you can cover it from another envelope.
          </Text>
        ) : (
          <Text variant="bodySm" tone="secondary">
            Safe to spend stays the same.
          </Text>
        )}
        <Text variant="bodySm" tone="secondary">
          {nextDueLine(envelope, money)}
        </Text>
      </View>
      {form.problem && form.funding.length > 0 ? (
        <Text accessibilityRole="alert" tone="warning" variant="bodySm">
          {form.problem}
        </Text>
      ) : null}
      <PanelError message={form.error} />
      <Button
        fullWidth
        label="Confirm paid"
        loading={form.busy}
        disabled={form.problem !== "" || form.funding.length === 0}
        onPress={() => void form.submit()}
      />
      <Button fullWidth label="Not yet" variant="tertiary" onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[3] },
  lines: { gap: space[1] },
});
