import type { ReactNode } from "react";
import { View } from "react-native";

import type { V2DueOccurrence } from "@trove/api/v2/contracts";

import type { DueBillsView } from "./due-bills-view";
import { dueRowNote } from "./due-copy";
import { dueDateLabel } from "./due-date-label";
import { dueFigure, dueWhen } from "./due-display";
import { occurrenceKey } from "./due-model";
import { DueListRow } from "./due-list-row";
import { DueSectionTitle } from "./due-section-title";

interface DueListSectionProps {
  /** "This week" or "Next payday". */
  readonly title: string;
  readonly items: readonly V2DueOccurrence[];
  readonly bills: DueBillsView;
  /** Drawn after the bills, e.g. the expected salary under Next payday. */
  readonly footer?: ReactNode;
}

/** A Due section of upcoming bills; tapping one opens Mark paid for paying early. */
export function DueListSection({ title, items, bills, footer }: DueListSectionProps) {
  return (
    <View>
      <DueSectionTitle label={title} spaced />
      {items.map((item) => {
        const figure = dueFigure(item.amountMinor, item.currency, bills.budgetCurrency);
        const note = dueRowNote({
          readiness: bills.readiness(item),
          scheduledDate: item.scheduledDate,
          accountName: bills.accountName(item.accountId),
          muted: bills.isMuted(item.ruleId),
          money: bills.money,
        });
        return (
          <DueListRow
            accessibilityLabel={`${item.name}, ${figure}, due ${dueDateLabel(item.scheduledDate)}. ${note.text}`}
            figure={figure}
            icon={bills.iconFor(item.categoryId)}
            key={occurrenceKey(item)}
            name={item.name}
            note={note}
            onPress={bills.canPay ? () => bills.openMarkPaid(item) : undefined}
            when={dueWhen(item.scheduledDate)}
          />
        );
      })}
      {footer}
    </View>
  );
}
