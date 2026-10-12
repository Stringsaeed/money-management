import { StyleSheet, View } from "react-native";

import { BudgetPill } from "@/ui/trove";

import { savingAmount, savingMeta, savingPill } from "./bills-copy";
import type { SavingRow as SavingRowData } from "./bills-model";
import { PaymentRow } from "./payment-row";
import { SavingBar } from "./saving-bar";

interface SavingRowProps {
  readonly row: SavingRowData;
  readonly icon: string;
  readonly currency: string;
  readonly today: string;
  readonly onPress: () => void;
  /** Absent when the person may not mark payments paid. */
  readonly onMarkPaid?: () => void;
}

/** One big payment: set aside of the target, its due date and pace, and Mark paid. */
export function SavingRow({ row, icon, currency, today, onPress, onMarkPaid }: SavingRowProps) {
  const meta = savingMeta(row, today, currency);
  const pill = savingPill(row, currency);
  const amount = savingAmount(row, currency);
  const hasTarget = row.targetMinor !== null;
  const label = [
    row.line.envelope.name,
    pill.spoken ?? pill.label,
    hasTarget ? `${amount.replace(" / ", " of ")} ${currency} set aside` : `${amount} ${currency}`,
    meta.toLowerCase(),
  ].join(", ");
  return (
    <PaymentRow
      accessibilityLabel={label}
      amount={amount}
      icon={icon}
      meta={meta}
      name={row.line.envelope.name}
      onPress={onPress}
      pill={pill}
    >
      {hasTarget ? (
        <View style={styles.second}>
          <SavingBar fraction={row.fraction} />
          {onMarkPaid ? (
            <BudgetPill label="Mark paid" onPress={onMarkPaid} size="sm" tone="accent" />
          ) : null}
        </View>
      ) : null}
    </PaymentRow>
  );
}

const styles = StyleSheet.create({
  second: { alignItems: "center", alignSelf: "stretch", flexDirection: "row", gap: 12 },
});
