import { StyleSheet, View } from "react-native";

import type { V2DueOccurrence } from "@trove/api/v2/contracts";

import type { DueBillsView } from "./due-bills-view";
import { dueCardSub } from "./due-copy";
import { dueFigure } from "./due-display";
import { occurrenceKey } from "./due-model";
import { DueNowCard } from "./due-now-card";
import { DueSectionTitle } from "./due-section-title";

interface DueNowSectionProps {
  /** "Today" or "Overdue". */
  readonly title: string;
  readonly late: boolean;
  readonly items: readonly V2DueOccurrence[];
  readonly bills: DueBillsView;
}

/** TODAY · N (or OVERDUE · N): each bill as a card with its payment and Mark paid. */
export function DueNowSection({ title, late, items, bills }: DueNowSectionProps) {
  return (
    <View style={styles.section}>
      <DueSectionTitle label={`${title} · ${items.length}`} tone={late ? "negative" : "warning"} />
      {items.map((item) => (
        <DueNowCard
          accounts={bills.accountsFor(item)}
          canPay={bills.canPay}
          figure={dueFigure(item.amountMinor, item.currency, bills.budgetCurrency)}
          icon={bills.iconFor(item.categoryId)}
          item={item}
          key={occurrenceKey(item)}
          late={late}
          muted={bills.isMuted(item.ruleId)}
          onChange={() => bills.openMarkPaid(item)}
          onSkip={bills.canPay ? () => bills.skip(item) : undefined}
          onSnooze={() => bills.snooze(item)}
          sub={dueCardSub({
            readiness: bills.readiness(item),
            accountName: bills.accountName(item.accountId),
            money: bills.money,
          })}
          today={bills.today}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ section: { gap: 10 } });
