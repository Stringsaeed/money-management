import { StyleSheet, View } from "react-native";

import type { V2Account } from "@trove/api/v2/contracts";

import { colors, radius } from "@/ui/trove";

import { accountTypeOption } from "../../ledger/accounts/account-display";

import { paymentDateLabel } from "./due-display";
import { MarkPaidFieldRow } from "./mark-paid-field-row";
import type { MarkPaidField } from "./mark-paid-field";

interface MarkPaidFieldsProps {
  /** Formatted, e.g. "AED 1,850.00". */
  readonly amount: string;
  readonly account: V2Account | undefined;
  readonly date: string;
  readonly today: string;
  readonly open: MarkPaidField | null;
  readonly onToggle: (field: MarkPaidField) => void;
}

/** Amount, Paid from and Date: tap one to change it for this payment only. */
export function MarkPaidFields({
  amount,
  account,
  date,
  today,
  open,
  onToggle,
}: MarkPaidFieldsProps) {
  return (
    <View style={styles.card}>
      <MarkPaidFieldRow
        divider
        label="Amount"
        mono
        onPress={() => onToggle("amount")}
        open={open === "amount"}
        value={amount}
      />
      <MarkPaidFieldRow
        divider
        label="Paid from"
        onPress={() => onToggle("account")}
        open={open === "account"}
        value={account ? `${accountTypeOption(account.type).emoji} ${account.name}` : "Choose"}
      />
      <MarkPaidFieldRow
        divider={false}
        label="Date"
        onPress={() => onToggle("date")}
        open={open === "date"}
        value={paymentDateLabel(date, today)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.subtle,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
});
