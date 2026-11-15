import { useState } from "react";
import { StyleSheet, View } from "react-native";

import type { V2Account, V2DueOccurrence } from "@trove/api/v2/contracts";

import { FlowButton, ListGroup, ListRow, space, Switch, Text } from "@/ui/trove";
import { formatMoneyMinor, parseMoneyMinor } from "@/utils/money";

import type { EnvelopeLine } from "../home/home-model";
import { impactMoney } from "../quick-add/quick-add-model";

import type { MarkPaidField } from "./mark-paid-field";
import { MarkPaidEditor } from "./mark-paid-editor";
import { MarkPaidFields } from "./mark-paid-fields";
import { MarkPaidHeader } from "./mark-paid-header";
import { MarkPaidReceipt } from "./mark-paid-receipt";
import { useMarkPaidForm } from "./use-mark-paid-form";

interface MarkPaidFormProps {
  readonly item: V2DueOccurrence;
  /** Where it can be paid from; see `markPaidAccounts`. */
  readonly accounts: readonly V2Account[];
  /** Today's Ledger Date: the payment is dated today unless changed. */
  readonly today: string;
  /** The envelope this bill comes out of, when the budget covers it. */
  readonly envelope: EnvelopeLine | null;
  /** Category icon for the header tile. */
  readonly icon: string | null;
  readonly muted: boolean;
  readonly onMutedChange: (muted: boolean) => void;
  readonly onPaid: () => void;
  /** "Not yet": close without recording anything. */
  readonly onCancel: () => void;
  /** Absent when the bill cannot be skipped from here. */
  readonly onSkip?: () => void;
}

/** Confirms a bill: amount, account and date are editable and apply to this payment only. */
export function MarkPaidForm({
  item,
  accounts,
  today,
  envelope,
  icon,
  muted,
  onMutedChange,
  onPaid,
  onCancel,
  onSkip,
}: MarkPaidFormProps) {
  const form = useMarkPaidForm({ item, accounts, today, onPaid });
  const [open, setOpen] = useState<MarkPaidField | null>(null);
  const payingMinor = parseMoneyMinor(form.amountText, item.currency) ?? 0;
  return (
    <View style={styles.container}>
      <MarkPaidHeader icon={icon} item={item} today={today} />
      <MarkPaidFields
        account={accounts.find((account) => account.id === form.accountId)}
        amount={formatMoneyMinor(payingMinor, item.currency)}
        date={form.date}
        onToggle={(field) => setOpen((current) => (current === field ? null : field))}
        open={open}
        today={today}
      />
      {open ? (
        <MarkPaidEditor
          accountId={form.accountId}
          accounts={accounts}
          amountText={form.amountText}
          currency={item.currency}
          date={form.date}
          field={open}
          onAccount={form.setAccountId}
          onAmount={form.setAmountText}
          onDate={form.setDate}
          onDone={() => setOpen(null)}
        />
      ) : null}
      {envelope ? (
        <MarkPaidReceipt
          currency={item.currency}
          envelope={envelope.envelope.name}
          leftMinor={envelope.totals.leftMinor}
          money={(minor) => impactMoney(minor, item.currency)}
          payingMinor={payingMinor}
        />
      ) : null}
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
      <View style={styles.actions}>
        <FlowButton
          disabled={form.busy}
          label="Not yet"
          onPress={onCancel}
          size="cta"
          style={styles.notYet}
          tone="outline"
        />
        <FlowButton
          label="Confirm paid"
          loading={form.busy}
          onPress={() => void form.submit()}
          size="cta"
          style={styles.confirm}
        />
      </View>
      {onSkip ? (
        <FlowButton label="Skip this month" onPress={onSkip} size="link" tone="text" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[3] + 2 },
  centered: { textAlign: "center" },
  actions: { flexDirection: "row", gap: space[2] + 2 },
  notYet: { flex: 1 },
  confirm: { flex: 1.4 },
});
