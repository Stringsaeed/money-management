import { useState } from "react";

import { Text } from "@/ui/trove";

import { AccountChips } from "./account-chips";
import { FieldButtonRow } from "./field-button-row";
import { FieldGroup } from "./field-group";
import { FieldInputRow } from "./field-input-row";
import { InlineDatePicker } from "./inline-date-picker";
import { paidOnLabel } from "./mark-paid-lines";
import type { useMarkPaidForm } from "./use-mark-paid-form";

interface MarkPaidFieldsProps {
  readonly form: ReturnType<typeof useMarkPaidForm>;
  readonly currency: string;
}

type Picker = "account" | "date" | null;

/** B3's Amount, Paid from and Date rows, with the account chips or calendar opened under them. */
export function MarkPaidFields({ form, currency }: MarkPaidFieldsProps) {
  const [picker, setPicker] = useState<Picker>(null);
  const toggle = (next: Exclude<Picker, null>) =>
    setPicker((current) => (current === next ? null : next));
  const account = form.funding.find((candidate) => candidate.id === form.accountId);
  const canPickAccount = form.funding.length > 1;
  return (
    <>
      <FieldGroup>
        <FieldInputRow
          font="money"
          height={50}
          keyboardType="decimal-pad"
          label="Amount"
          onChangeText={form.setAmountText}
          placeholder="0"
          prefix={currency}
          value={form.amountText}
        />
        <FieldButtonRow
          chevron
          expanded={canPickAccount ? picker === "account" : undefined}
          font="words"
          height={50}
          label="Paid from"
          onPress={canPickAccount ? () => toggle("account") : undefined}
          value={account?.name ?? "No account"}
        />
        <FieldButtonRow
          chevron
          expanded={picker === "date"}
          font="words"
          height={50}
          label="Date"
          onPress={() => toggle("date")}
          value={paidOnLabel(form.date, form.today)}
        />
      </FieldGroup>
      {form.funding.length === 0 ? (
        <Text tone="warning" variant="bodySm">
          {`No ${currency} account is in your budget, so there is nothing to pay from.`}
        </Text>
      ) : null}
      {picker === "account" ? (
        <AccountChips
          accounts={form.funding}
          onSelect={form.selectAccount}
          selectedId={form.accountId}
        />
      ) : null}
      {picker === "date" ? (
        <InlineDatePicker
          date={form.date}
          maxDate={form.today}
          minDate={form.periodStart}
          onChange={form.setDate}
        />
      ) : null}
    </>
  );
}
