import { View } from "react-native";

import type { PaidBill } from "./due-paid";
import { dueFigure, paidWhen } from "./due-display";
import { DueListRow } from "./due-list-row";
import { DueSectionTitle } from "./due-section-title";

interface DuePaidSectionProps {
  readonly bills: readonly PaidBill[];
  readonly budgetCurrency: string;
}

/** PAID THIS MONTH · N: bills already marked paid this Budget Period, newest first. */
export function DuePaidSection({ bills, budgetCurrency }: DuePaidSectionProps) {
  return (
    <View>
      <DueSectionTitle label={`Paid this month · ${bills.length}`} spaced />
      {bills.map((bill) => {
        const figure = dueFigure(bill.amountMinor, bill.currency, budgetCurrency);
        const note = bill.accountName ? `Paid from ${bill.accountName} ✓` : "Paid ✓";
        return (
          <DueListRow
            accessibilityLabel={`${bill.name}, ${figure}, paid ${paidWhen(bill.date)}. ${note}`}
            figure={figure}
            icon={bill.icon}
            key={bill.id}
            name={bill.name}
            note={{ text: note, tone: "secondary" }}
            quiet
            when={paidWhen(bill.date)}
          />
        );
      })}
    </View>
  );
}
